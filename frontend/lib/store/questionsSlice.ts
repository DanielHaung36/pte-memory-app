import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Question } from './questionsApi'

// 错题管理状态
interface QuestionsState {
  // UI状态
  selectedQuestions: string[]
  isCreating: boolean
  isEditing: boolean
  editingQuestionId: string | null
  
  // 筛选和排序
  filters: {
    type: 'all' | 'speaking' | 'writing' | 'reading' | 'listening'
    difficulty: 'all' | '1' | '2' | '3' | '4' | '5'
    tags: string[]
    dateRange: {
      start: string | null
      end: string | null
    }
    searchTerm: string
    onlyDue: boolean
    onlyOverdue: boolean
  }
  
  sortBy: 'created_at' | 'updated_at' | 'difficulty_level' | 'next_review_date' | 'accuracy_rate'
  sortOrder: 'asc' | 'desc'
  
  // 复习模式
  reviewMode: {
    isActive: boolean
    currentQuestionIndex: number
    questions: Question[]
    sessionStats: {
      total: number
      correct: number
      wrong: number
      startTime: number
    }
  }
  
  // 批量操作
  batchActions: {
    isSelecting: boolean
    selectedCount: number
  }
  
  // 实时统计
  stats: {
    totalQuestions: number
    dueQuestions: number
    overdueQuestions: number
    masteredQuestions: number
    todayReviewed: number
    streakDays: number
  }
}

const initialState: QuestionsState = {
  selectedQuestions: [],
  isCreating: false,
  isEditing: false,
  editingQuestionId: null,
  
  filters: {
    type: 'all',
    difficulty: 'all',
    tags: [],
    dateRange: {
      start: null,
      end: null,
    },
    searchTerm: '',
    onlyDue: false,
    onlyOverdue: false,
  },
  
  sortBy: 'created_at',
  sortOrder: 'desc',
  
  reviewMode: {
    isActive: false,
    currentQuestionIndex: 0,
    questions: [],
    sessionStats: {
      total: 0,
      correct: 0,
      wrong: 0,
      startTime: 0,
    },
  },
  
  batchActions: {
    isSelecting: false,
    selectedCount: 0,
  },
  
  stats: {
    totalQuestions: 0,
    dueQuestions: 0,
    overdueQuestions: 0,
    masteredQuestions: 0,
    todayReviewed: 0,
    streakDays: 0,
  },
}

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    // 选择错题
    toggleQuestionSelection: (state, action: PayloadAction<string>) => {
      const questionId = action.payload
      const index = state.selectedQuestions.indexOf(questionId)
      
      if (index > -1) {
        state.selectedQuestions.splice(index, 1)
      } else {
        state.selectedQuestions.push(questionId)
      }
      
      state.batchActions.selectedCount = state.selectedQuestions.length
    },

    selectAllQuestions: (state, action: PayloadAction<string[]>) => {
      state.selectedQuestions = action.payload
      state.batchActions.selectedCount = action.payload.length
    },

    clearSelection: (state) => {
      state.selectedQuestions = []
      state.batchActions.selectedCount = 0
    },

    // 批量操作模式
    toggleBatchMode: (state) => {
      state.batchActions.isSelecting = !state.batchActions.isSelecting
      if (!state.batchActions.isSelecting) {
        state.selectedQuestions = []
        state.batchActions.selectedCount = 0
      }
    },

    // 创建/编辑状态
    setCreatingMode: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload
    },

    setEditingMode: (state, action: PayloadAction<{ editing: boolean; questionId?: string }>) => {
      state.isEditing = action.payload.editing
      state.editingQuestionId = action.payload.questionId || null
    },

    // 筛选器
    setFilter: (state, action: PayloadAction<Partial<QuestionsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    resetFilters: (state) => {
      state.filters = initialState.filters
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.searchTerm = action.payload
    },

    // 排序
    setSorting: (state, action: PayloadAction<{ sortBy: QuestionsState['sortBy']; sortOrder: QuestionsState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },

    // 复习模式
    startReviewSession: (state, action: PayloadAction<Question[]>) => {
      state.reviewMode.isActive = true
      state.reviewMode.questions = action.payload
      state.reviewMode.currentQuestionIndex = 0
      state.reviewMode.sessionStats = {
        total: action.payload.length,
        correct: 0,
        wrong: 0,
        startTime: Date.now(),
      }
    },

    endReviewSession: (state) => {
      state.reviewMode = initialState.reviewMode
    },

    nextReviewQuestion: (state) => {
      if (state.reviewMode.currentQuestionIndex < state.reviewMode.questions.length - 1) {
        state.reviewMode.currentQuestionIndex++
      }
    },

    previousReviewQuestion: (state) => {
      if (state.reviewMode.currentQuestionIndex > 0) {
        state.reviewMode.currentQuestionIndex--
      }
    },

    recordReviewAnswer: (state, action: PayloadAction<{ isCorrect: boolean }>) => {
      if (action.payload.isCorrect) {
        state.reviewMode.sessionStats.correct++
      } else {
        state.reviewMode.sessionStats.wrong++
      }
    },

    // 统计数据
    updateStats: (state, action: PayloadAction<Partial<QuestionsState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },

    // WebSocket实时更新
    updateQuestionFromSocket: (state, action: PayloadAction<Question>) => {
      // 处理从WebSocket接收到的错题更新
    },

    updateStatsFromSocket: (state, action: PayloadAction<Partial<QuestionsState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },
  },
})

export const {
  toggleQuestionSelection,
  selectAllQuestions,
  clearSelection,
  toggleBatchMode,
  setCreatingMode,
  setEditingMode,
  setFilter,
  resetFilters,
  setSearchTerm,
  setSorting,
  startReviewSession,
  endReviewSession,
  nextReviewQuestion,
  previousReviewQuestion,
  recordReviewAnswer,
  updateStats,
  updateQuestionFromSocket,
  updateStatsFromSocket,
} = questionsSlice.actions

export default questionsSlice.reducer