'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useReduxAuth } from '@/hooks/useReduxAuth'
import axios from '@/lib/axios'
import { toast } from 'sonner'

interface Question {
  id: string
  title: string
  content: string
  answer: string
  explanation?: string
  question_type: string
  difficulty_level: number
  audio_url?: string
  tags?: string[]
  created_at: string
}

interface ReviewItem {
  id: string
  question: Question
  next_review: string
  ease_factor: number
  repetition: number
  interval: number
  quality?: number
}

interface ReviewStats {
  total_reviews_today: number
  correct_reviews_today: number
  streak: number
  accuracy_rate: number
  questions_due: number
}

interface ReviewContextType {
  dueReviews: ReviewItem[]
  reviewStats: ReviewStats
  isLoading: boolean
  currentReview: ReviewItem | null
  reviewHistory: ReviewItem[]
  
  // Actions
  loadDueReviews: () => Promise<void>
  loadReviewStats: () => Promise<void>
  startReview: (reviewId: string) => void
  submitReview: (reviewId: string, quality: number, timeSpent: number) => Promise<void>
  skipReview: (reviewId: string) => Promise<void>
  resetReview: () => void
  
  // Game mode
  isGameMode: boolean
  gameScore: number
  comboCount: number
  setGameMode: (enabled: boolean) => void
}

const defaultStats: ReviewStats = {
  total_reviews_today: 0,
  correct_reviews_today: 0,
  streak: 0,
  accuracy_rate: 0,
  questions_due: 0
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined)

export function ReviewProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useReduxAuth()
  const [dueReviews, setDueReviews] = useState<ReviewItem[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(false)
  const [currentReview, setCurrentReview] = useState<ReviewItem | null>(null)
  const [reviewHistory, setReviewHistory] = useState<ReviewItem[]>([])
  
  // Game mode state
  const [isGameMode, setIsGameMode] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [comboCount, setComboCount] = useState(0)

  const loadDueReviews = async () => {
    if (!isAuthenticated || !user) return
    
    setIsLoading(true)
    try {
      const response = await axios.get('/reviews/due')
      setDueReviews(response.data || [])
    } catch (error) {
      console.error('Failed to load due reviews:', error)
      toast.error('加载复习内容失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviewStats = async () => {
    if (!isAuthenticated || !user) return
    
    try {
      const response = await axios.get('/reviews/stats')
      setReviewStats(response.data || defaultStats)
    } catch (error) {
      console.error('Failed to load review stats:', error)
    }
  }

  const startReview = (reviewId: string) => {
    const review = dueReviews.find(r => r.id === reviewId)
    if (review) {
      setCurrentReview(review)
    }
  }

  const submitReview = async (reviewId: string, quality: number, timeSpent: number) => {
    if (!isAuthenticated || !user) return

    try {
      const response = await axios.post(`/reviews/${reviewId}/submit`, {
        quality,
        time_spent: timeSpent
      })

      // Update local state
      const reviewedItem = dueReviews.find(r => r.id === reviewId)
      if (reviewedItem) {
        setReviewHistory(prev => [reviewedItem, ...prev.slice(0, 19)]) // Keep last 20
        setDueReviews(prev => prev.filter(r => r.id !== reviewId))
        
        // Game mode scoring
        if (isGameMode) {
          if (quality >= 3) { // Correct answer
            setComboCount(prev => prev + 1)
            const comboMultiplier = Math.min(comboCount + 1, 10) // Max 10x multiplier
            const basePoints = quality === 5 ? 100 : quality === 4 ? 80 : 60
            const timeBonus = Math.max(0, 30 - timeSpent) * 2 // Time bonus
            const totalPoints = basePoints * comboMultiplier + timeBonus
            setGameScore(prev => prev + totalPoints)
            
            toast.success(`正确！+${totalPoints}分 (连击 x${comboMultiplier})`, {
              duration: 2000
            })
          } else {
            setComboCount(0)
            toast.error('回答错误，连击中断', { duration: 2000 })
          }
        } else {
          // Normal mode feedback
          if (quality >= 3) {
            toast.success('回答正确！', { duration: 1500 })
          } else {
            toast.error('需要继续巩固', { duration: 1500 })
          }
        }
      }

      setCurrentReview(null)
      await loadReviewStats()
      
    } catch (error) {
      console.error('Failed to submit review:', error)
      toast.error('提交复习结果失败')
    }
  }

  const skipReview = async (reviewId: string) => {
    try {
      await axios.post(`/reviews/${reviewId}/skip`)
      setDueReviews(prev => prev.filter(r => r.id !== reviewId))
      setCurrentReview(null)
      
      if (isGameMode) {
        setComboCount(0)
        toast.warning('跳过题目，连击中断')
      }
      
    } catch (error) {
      console.error('Failed to skip review:', error)
      toast.error('跳过复习失败')
    }
  }

  const resetReview = () => {
    setCurrentReview(null)
    if (isGameMode) {
      setGameScore(0)
      setComboCount(0)
    }
  }

  const setGameMode = (enabled: boolean) => {
    setIsGameMode(enabled)
    if (enabled) {
      setGameScore(0)
      setComboCount(0)
      toast.success('连击挑战模式开启！', { duration: 2000 })
    }
  }

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDueReviews()
      loadReviewStats()
    } else {
      setDueReviews([])
      setReviewStats(defaultStats)
      setCurrentReview(null)
      setReviewHistory([])
    }
  }, [isAuthenticated, user])

  // Auto-refresh due reviews every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return
    
    const interval = setInterval(() => {
      loadDueReviews()
      loadReviewStats()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const value = {
    dueReviews,
    reviewStats,
    isLoading,
    currentReview,
    reviewHistory,
    loadDueReviews,
    loadReviewStats,
    startReview,
    submitReview,
    skipReview,
    resetReview,
    isGameMode,
    gameScore,
    comboCount,
    setGameMode
  }

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  )
}

export function useReview() {
  const context = useContext(ReviewContext)
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider')
  }
  return context
}