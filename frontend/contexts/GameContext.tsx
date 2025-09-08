'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useReduxAuth } from '@/hooks/useReduxAuth'
import axios from '@/lib/axios'
import { toast } from 'sonner'

interface GameStats {
  total_games: number
  total_score: number
  best_score: number
  best_accuracy: number
  fastest_time: number
  favorite_game: string
  level: number
  xp: number
}

interface GameRecord {
  id: string
  game_type: string
  score: number
  accuracy: number
  time_spent: number
  completed_at: string
  combo_count: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
  progress?: number
  target?: number
}

interface GameContextType {
  gameStats: GameStats
  recentGames: GameRecord[]
  achievements: Achievement[]
  isLoading: boolean
  
  // Game state
  currentGame: string | null
  gameSession: {
    start_time: Date
    score: number
    combo: number
    questions_answered: number
    correct_answers: number
  } | null
  
  // Actions
  loadGameStats: () => Promise<void>
  loadRecentGames: () => Promise<void>
  loadAchievements: () => Promise<void>
  startGame: (gameType: string) => void
  endGame: () => Promise<void>
  updateGameSession: (update: Partial<GameContextType['gameSession']>) => void
  recordGameResult: (gameType: string, score: number, accuracy: number, timeSpent: number, comboCount: number) => Promise<void>
  
  // Rewards
  showReward: (message: string, xp: number) => void
  checkLevelUp: () => void
}

const defaultStats: GameStats = {
  total_games: 0,
  total_score: 0,
  best_score: 0,
  best_accuracy: 0,
  fastest_time: 0,
  favorite_game: '',
  level: 1,
  xp: 0
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useReduxAuth()
  const [gameStats, setGameStats] = useState<GameStats>(defaultStats)
  const [recentGames, setRecentGames] = useState<GameRecord[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Game session state
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [gameSession, setGameSession] = useState<GameContextType['gameSession']>(null)

  const loadGameStats = async () => {
    if (!isAuthenticated || !user) return
    
    setIsLoading(true)
    try {
      const response = await axios.get('/games/stats')
      setGameStats(response.data || defaultStats)
    } catch (error) {
      console.error('Failed to load game stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRecentGames = async () => {
    if (!isAuthenticated || !user) return
    
    try {
      const response = await axios.get('/games/recent')
      setRecentGames(response.data || [])
    } catch (error) {
      console.error('Failed to load recent games:', error)
    }
  }

  const loadAchievements = async () => {
    if (!isAuthenticated || !user) return
    
    try {
      const response = await axios.get('/games/achievements')
      setAchievements(response.data || [])
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }

  const startGame = (gameType: string) => {
    setCurrentGame(gameType)
    setGameSession({
      start_time: new Date(),
      score: 0,
      combo: 0,
      questions_answered: 0,
      correct_answers: 0
    })
    
    toast.success(`开始${getGameTypeName(gameType)}游戏！`, { duration: 1500 })
  }

  const endGame = async () => {
    if (!gameSession || !currentGame) return
    
    const timeSpent = Math.floor((new Date().getTime() - gameSession.start_time.getTime()) / 1000)
    const accuracy = gameSession.questions_answered > 0 
      ? (gameSession.correct_answers / gameSession.questions_answered) * 100 
      : 0
    
    await recordGameResult(
      currentGame, 
      gameSession.score, 
      accuracy, 
      timeSpent, 
      gameSession.combo
    )
    
    // Show completion message
    toast.success(
      `游戏完成！得分: ${gameSession.score}，准确率: ${accuracy.toFixed(1)}%`,
      { duration: 3000 }
    )
    
    setCurrentGame(null)
    setGameSession(null)
  }

  const updateGameSession = (update: Partial<GameContextType['gameSession']>) => {
    setGameSession(prev => prev ? { ...prev, ...update } : null)
  }

  const recordGameResult = async (
    gameType: string, 
    score: number, 
    accuracy: number, 
    timeSpent: number, 
    comboCount: number
  ) => {
    if (!isAuthenticated || !user) return
    
    try {
      await axios.post('/games/record', {
        game_type: gameType,
        score,
        accuracy,
        time_spent: timeSpent,
        combo_count: comboCount
      })
      
      // Refresh stats and recent games
      await loadGameStats()
      await loadRecentGames()
      
      // Check for achievements
      checkLevelUp()
      
    } catch (error) {
      console.error('Failed to record game result:', error)
      toast.error('记录游戏结果失败')
    }
  }

  const showReward = (message: string, xp: number) => {
    toast.success(`🎉 ${message} +${xp} XP`, { 
      duration: 3000,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    })
  }

  const checkLevelUp = () => {
    const newLevel = Math.floor(gameStats.xp / 1000) + 1
    if (newLevel > gameStats.level) {
      showReward(`恭喜升级到 Level ${newLevel}！`, 0)
      
      // Unlock level-based achievements
      setTimeout(() => {
        toast.success(`🏆 解锁新成就！`, { duration: 2000 })
      }, 1000)
    }
  }

  const getGameTypeName = (gameType: string): string => {
    const names: Record<string, string> = {
      'word_matching': '单词配对',
      'quick_select': '快速选择',
      'memory_flip': '记忆翻牌',
      'listening_practice': '听力练习',
      'spelling_challenge': '拼写挑战'
    }
    return names[gameType] || gameType
  }

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGameStats()
      loadRecentGames()
      loadAchievements()
    } else {
      setGameStats(defaultStats)
      setRecentGames([])
      setAchievements([])
      setCurrentGame(null)
      setGameSession(null)
    }
  }, [isAuthenticated, user])

  const value = {
    gameStats,
    recentGames,
    achievements,
    isLoading,
    currentGame,
    gameSession,
    loadGameStats,
    loadRecentGames,
    loadAchievements,
    startGame,
    endGame,
    updateGameSession,
    recordGameResult,
    showReward,
    checkLevelUp
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}