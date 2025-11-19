import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from './index'
import { API_CONFIG } from '../config'

const API_BASE_URL = API_CONFIG.BACKEND_URL

// 错题类型定义
export interface Question {
  id: string
  user_id: string
  title: string
  content: string
  question_type: 'speaking' | 'writing' | 'reading' | 'listening'
  sub_type?: string
  correct_answer: string
  user_answer: string
  explanation?: string
  difficulty_level: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  audio_url?: string
  image_url?: string
  time_limit?: number
  points: number
  source?: string
  source_id?: string
  is_public?: boolean
  created_at: string
  updated_at: string
  review_schedule?: ReviewSchedule
  question_stats?: QuestionStats
}

export interface ReviewSchedule {
  id: string
  user_id: string
  question_id: string
  current_interval: number
  ease_factor: number
  repetition_count: number
  next_review_date: string
  last_review_date?: string
  is_completed: boolean
  is_mastered: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface QuestionStats {
  id: string
  question_id: string
  times_reviewed: number
  times_correct: number
  times_wrong: number
  accuracy_rate: number
  average_response_time: number
  fastest_response_time: number
  slowest_response_time: number
  last_correct_date?: string
  last_wrong_date?: string
  created_at: string
  updated_at: string
}

export interface GeneralQuestionStats {
  total_questions: number
  due_questions: number
  overdue_questions: number
  mastered_questions: number
  today_reviewed: number
  weekly_reviewed: number
  monthly_reviewed: number
  average_accuracy: number
  type_breakdown: Record<string, number>
  difficulty_breakdown: Record<string, number>
  tag_stats: Record<string, number>
}

export interface CreateQuestionRequest {
  title: string
  content: string
  question_type: 'speaking' | 'writing' | 'reading' | 'listening'
  sub_type?: string
  correct_answer: string
  user_answer: string
  explanation?: string
  difficulty_level?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  audio_url?: string
  image_url?: string
  time_limit?: number
  source?: string
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  id: string
}

export interface ReviewQuestionRequest {
  question_id: string
  is_correct: boolean
  confidence_level?: number
  response_time?: number
}

// RTK Query API
export const questionsApi = createApi({
  reducerPath: 'questionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: 'include', // Include cookies in requests
    prepareHeaders: (headers) => {
      // Remove token management - now handled by HTTP-only cookies
      return headers
    },
  }),
  tagTypes: ['Question', 'ReviewSchedule', 'QuestionStats'],
  endpoints: (builder) => ({
    // 获取所有错题
    getQuestions: builder.query<
      { questions: Question[]; total: number; limit: number; offset: number },
      { type?: string; limit?: number; offset?: number }
    >({
      query: ({ type, limit = 50, offset = 0 }) => ({
        url: '/api/questions',
        params: { type, limit, offset },
      }),
      providesTags: ['Question'],
    }),

    // 获取单个错题
    getQuestion: builder.query<{ question: Question }, string>({
      query: (id) => `/api/questions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    // 创建错题
    createQuestion: builder.mutation<{ message: string; question: Question }, CreateQuestionRequest>({
      query: (question) => ({
        url: '/api/questions',
        method: 'POST',
        body: question,
      }),
      invalidatesTags: ['Question'],
    }),

    // 更新错题
    updateQuestion: builder.mutation<{ message: string; question: Question }, UpdateQuestionRequest>({
      query: ({ id, ...patch }) => ({
        url: `/api/questions/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Question', id }],
    }),

    // 删除错题
    deleteQuestion: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Question'],
    }),

    // 获取待复习错题
    getDueQuestions: builder.query<{ questions: Question[]; count: number }, { limit?: number; specific_question_id?: string }>({
      query: ({ limit = 20, specific_question_id }) => ({
        url: '/api/questions/due',
        params: { 
          limit,
          ...(specific_question_id && { question_id: specific_question_id })
        },
      }),
      providesTags: ['Question', 'ReviewSchedule'],
    }),

    // 获取逾期错题
    getOverdueQuestions: builder.query<{ questions: Question[]; count: number }, void>({
      query: () => '/api/questions/overdue',
      providesTags: ['Question', 'ReviewSchedule'],
    }),

    // 按类型获取错题
    getQuestionsByType: builder.query<
      { questions: Question[]; count: number; type: string },
      string
    >({
      query: (type) => `/api/questions/type/${type}`,
      providesTags: ['Question'],
    }),

    // 复习错题
    reviewQuestion: builder.mutation<{ message: string }, ReviewQuestionRequest>({
      query: (reviewData) => ({
        url: '/api/questions/review',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Question', 'ReviewSchedule', 'QuestionStats'],
    }),

    // 获取错题统计
    getQuestionStats: builder.query<{ stats: QuestionStats }, string>({
      query: (questionId) => `/api/questions/${questionId}/stats`,
      providesTags: (result, error, questionId) => [{ type: 'QuestionStats', id: questionId }],
    }),


    // 批量操作错题
    batchUpdateQuestions: builder.mutation<
      { message: string; updated: number },
      { question_ids: string[]; action: 'delete' | 'archive' | 'priority'; value?: any }
    >({
      query: (batchData) => ({
        url: '/api/questions/batch',
        method: 'POST',
        body: batchData,
      }),
      invalidatesTags: ['Question'],
    }),

    // 获取问题统计数据
    getQuestionStatistics: builder.query<{
      statistics: {
        total_questions: number;
        due_questions: number;
        overdue_questions: number;
        mastered_questions: number;
        today_reviewed: number;
        weekly_reviewed: number;
        monthly_reviewed: number;
        average_accuracy: number;
        type_breakdown: Record<string, number>;
        difficulty_breakdown: Record<string, number>;
        tag_stats: Record<string, number>;
      }
    }, void>({
      query: () => '/api/questions/statistics',
      providesTags: ['Question', 'QuestionStats'],
    }),

    // 获取复习历史数据
    getReviewHistory: builder.query<{
      reviews: Array<{
        date: string;
        review_count: number;
        accuracy_rate: number;
        time_spent: number;
        streak_day: boolean;
        completed_goal: boolean;
      }>
    }, { days?: number }>({
      query: ({ days = 365 }) => ({
        url: '/api/reviews/history',
        params: { days },
      }),
      providesTags: ['QuestionStats'],
    }),
  }),
})

// 导出hooks
export const {
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetDueQuestionsQuery,
  useGetOverdueQuestionsQuery,
  useGetQuestionsByTypeQuery,
  useReviewQuestionMutation,
  useGetQuestionStatsQuery,
  useBatchUpdateQuestionsMutation,
  useGetQuestionStatisticsQuery,
  useGetReviewHistoryQuery,
} = questionsApi