import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from './index'

interface WrongQuestion {
  id: string
  user_id: string
  question_id: string
  user_answer: string
  correct_answer: string
  error_type: string
  error_reason: string
  difficulty: number
  is_resolved: boolean
  resolved_at?: string
  times_wrong: number
  last_wrong_at: string
  notes: string
  priority: number
  tags: string[]
  created_at: string
  updated_at: string
  question?: any
  user?: any
}

interface WrongQuestionListResponse {
  wrong_questions: WrongQuestion[]
  total: number
  limit: number
  offset: number
}

interface WrongQuestionStats {
  total_wrong: number
  resolved: number
  unresolved: number
  by_type: Array<{ error_type: string; count: number }>
  by_priority: Array<{ priority: number; count: number }>
}

interface CreateWrongQuestionRequest {
  question_id: string
  user_answer: string
  correct_answer: string
  error_type: string
  error_reason: string
  difficulty?: number
  notes?: string
  priority?: number
  tags?: string[]
}

interface UpdateWrongQuestionRequest {
  error_reason?: string
  notes?: string
  priority?: number
  tags?: string[]
  is_resolved?: boolean
}

interface BatchUpdateRequest {
  wrong_question_ids: string[]
  action: 'resolve' | 'update_priority' | 'delete'
  value?: any
}

export const wrongQuestionsApi = createApi({
  reducerPath: 'wrongQuestionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:8081/api/wrong-questions' : '/api/wrong-questions',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['WrongQuestion', 'WrongQuestionStats'],
  endpoints: (builder) => ({
    // 获取错题列表
    getWrongQuestions: builder.query<WrongQuestionListResponse, {
      limit?: number
      offset?: number
      error_type?: string
      is_resolved?: boolean
      priority?: number
    }>({
      query: (params = {}) => ({
        url: '',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.wrong_questions.map(({ id }) => ({ type: 'WrongQuestion' as const, id })),
              { type: 'WrongQuestion', id: 'LIST' },
            ]
          : [{ type: 'WrongQuestion', id: 'LIST' }],
    }),

    // 获取单个错题
    getWrongQuestion: builder.query<{ wrong_question: WrongQuestion }, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'WrongQuestion', id }],
    }),

    // 创建错题
    createWrongQuestion: builder.mutation<{ wrong_question: WrongQuestion }, CreateWrongQuestionRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'WrongQuestion', id: 'LIST' },
        { type: 'WrongQuestionStats' }
      ],
    }),

    // 更新错题
    updateWrongQuestion: builder.mutation<{ wrong_question: WrongQuestion }, {
      id: string
      data: UpdateWrongQuestionRequest
    }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WrongQuestion', id },
        { type: 'WrongQuestion', id: 'LIST' },
        { type: 'WrongQuestionStats' }
      ],
    }),

    // 删除错题
    deleteWrongQuestion: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'WrongQuestion', id },
        { type: 'WrongQuestion', id: 'LIST' },
        { type: 'WrongQuestionStats' }
      ],
    }),

    // 获取错题统计
    getWrongQuestionStats: builder.query<{ stats: WrongQuestionStats }, void>({
      query: () => '/stats',
      providesTags: [{ type: 'WrongQuestionStats' }],
    }),

    // 搜索错题
    searchWrongQuestions: builder.query<WrongQuestionListResponse, {
      q?: string
      error_type?: string
      priority?: number
      is_resolved?: boolean
      tags?: string
      sort_by?: string
      sort_order?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/search',
        params,
      }),
      providesTags: [{ type: 'WrongQuestion', id: 'SEARCH' }],
    }),

    // 批量操作错题
    batchUpdateWrongQuestions: builder.mutation<{ message: string; updated: number }, BatchUpdateRequest>({
      query: (data) => ({
        url: '/batch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'WrongQuestion', id: 'LIST' },
        { type: 'WrongQuestion', id: 'SEARCH' },
        { type: 'WrongQuestionStats' }
      ],
    }),
  }),
})

export const {
  useGetWrongQuestionsQuery,
  useGetWrongQuestionQuery,
  useCreateWrongQuestionMutation,
  useUpdateWrongQuestionMutation,
  useDeleteWrongQuestionMutation,
  useGetWrongQuestionStatsQuery,
  useSearchWrongQuestionsQuery,
  useBatchUpdateWrongQuestionsMutation,
} = wrongQuestionsApi