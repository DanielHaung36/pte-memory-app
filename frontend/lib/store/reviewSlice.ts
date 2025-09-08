import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ReviewSession {
  id: string
  startTime: number
  endTime?: number
  questionsReviewed: number
  correctAnswers: number
  totalTime: number
}

interface ReviewState {
  currentSession: ReviewSession | null
  isReviewing: boolean
  reviewSettings: {
    autoPlay: boolean
    showTimer: boolean
    timeLimit: number // seconds
    shuffleQuestions: boolean
    showAnswer: boolean
    confidenceMode: boolean
  }
  stats: {
    todayReviewed: number
    weeklyReviewed: number
    monthlyReviewed: number
    streak: number
    averageAccuracy: number
  }
}

const initialState: ReviewState = {
  currentSession: null,
  isReviewing: false,
  reviewSettings: {
    autoPlay: false,
    showTimer: true,
    timeLimit: 60,
    shuffleQuestions: true,
    showAnswer: true,
    confidenceMode: false,
  },
  stats: {
    todayReviewed: 0,
    weeklyReviewed: 0,
    monthlyReviewed: 0,
    streak: 0,
    averageAccuracy: 0,
  },
}

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    startReviewSession: (state) => {
      state.currentSession = {
        id: Date.now().toString(),
        startTime: Date.now(),
        questionsReviewed: 0,
        correctAnswers: 0,
        totalTime: 0,
      }
      state.isReviewing = true
    },
    
    endReviewSession: (state) => {
      if (state.currentSession) {
        state.currentSession.endTime = Date.now()
        state.currentSession.totalTime = state.currentSession.endTime - state.currentSession.startTime
      }
      state.isReviewing = false
    },
    
    recordAnswer: (state, action: PayloadAction<{ isCorrect: boolean; responseTime: number }>) => {
      if (state.currentSession) {
        state.currentSession.questionsReviewed++
        if (action.payload.isCorrect) {
          state.currentSession.correctAnswers++
        }
      }
    },
    
    updateReviewSettings: (state, action: PayloadAction<Partial<ReviewState['reviewSettings']>>) => {
      state.reviewSettings = { ...state.reviewSettings, ...action.payload }
      localStorage.setItem('reviewSettings', JSON.stringify(state.reviewSettings))
    },
    
    updateReviewStats: (state, action: PayloadAction<Partial<ReviewState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },
    
    initializeReviewSettings: (state) => {
      const saved = localStorage.getItem('reviewSettings')
      if (saved) {
        try {
          state.reviewSettings = { ...state.reviewSettings, ...JSON.parse(saved) }
        } catch {
          // 忽略解析错误，使用默认设置
        }
      }
    },
  },
})

export const {
  startReviewSession,
  endReviewSession,
  recordAnswer,
  updateReviewSettings,
  updateReviewStats,
  initializeReviewSettings,
} = reviewSlice.actions

export default reviewSlice.reducer