import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Question {
  id: string
  title: string
  content: string
  question_type: string
  sub_type?: string
  exam_type?: string
  exam_module?: string
  difficulty_level: number
  created_at: string
}

interface PracticeQuestionsResponse {
  questions: Question[]
  total: number
  exam_type: string
}

interface MockTestResponse {
  test_id: string
  questions: Question[]
  duration: number
  message: string
}

interface ExamStatisticsResponse {
  total_practiced: number
  by_type: Record<string, number>
  by_module: Record<string, number>
  average_score: number
  recent_performance: any[]
}

interface QuestionTypesResponse {
  pte_types: string[]
  ielts_types: string[]
}

// 考试会话相关接口
interface SectionScore {
  score: number
  max_score: number
  percentage: number
  questions_count: number
  correct_count: number
  accuracy_rate: number
}

interface ScoreBreakdown {
  speaking: SectionScore
  writing: SectionScore
  reading: SectionScore
  listening: SectionScore
  overall: number
}

interface AnswerRecord {
  question_id: string
  question_type: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  time_spent: number
  confidence_level: number
  is_skipped: boolean
  answered_at: string
  score: number
}

interface ExamSession {
  id: string
  user_id: string
  exam_type: string
  exam_module?: string
  test_type?: string
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  current_question_index: number
  total_questions: number
  started_at: string
  paused_at?: string
  resumed_at?: string
  completed_at?: string
  time_spent: number
  pause_duration: number
  time_limit: number
  answers: AnswerRecord[]
  question_ids: string[]
  questions_answered: number
  correct_answers: number
  wrong_answers: number
  skipped_questions: number
  score_breakdown: ScoreBreakdown
  total_score: number
  is_completed: boolean
  created_at: string
  updated_at: string
}

interface StartExamResponse {
  session_id: string
  questions: Question[]
  exam_type: string
  module?: string
  total_questions: number
  time_limit: number
  started_at: string
  status: string
}

interface ExamSessionsResponse {
  sessions: ExamSession[]
  total: number
}

interface ExamReportResponse {
  session_id: string
  exam_type: string
  completed_at: string
  time_spent: number
  overall_score: number
  score_breakdown: ScoreBreakdown
  statistics: {
    total_questions: number
    questions_answered: number
    correct_answers: number
    wrong_answers: number
    skipped_questions: number
    accuracy_rate: number
  }
  wrong_answers: AnswerRecord[]
  weak_points: Record<string, number>
  weak_points_ranked: Array<{type: string; count: number}>
  time_analysis: {
    total_time: number
    pause_duration: number
    effective_time: number
    avg_time_per_question: number
  }
  suggestions: string[]
}

export const examApi = createApi({
  reducerPath: 'examApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/exams',
    credentials: 'include',
  }),
  tagTypes: ['ExamPractice', 'ExamStats', 'ExamSessions'],
  endpoints: (builder) => ({
    // 获取PTE练习题
    getPTEPractice: builder.query<PracticeQuestionsResponse, {
      type?: string
      subtype?: string
      limit?: number
    }>({
      query: (params) => ({
        url: '/pte/practice',
        params,
      }),
      providesTags: ['ExamPractice'],
    }),

    // 获取IELTS练习题
    getIELTSPractice: builder.query<PracticeQuestionsResponse, {
      type?: string
      task?: string
      module?: string
      limit?: number
    }>({
      query: (params) => ({
        url: '/ielts/practice',
        params,
      }),
      providesTags: ['ExamPractice'],
    }),

    // 获取公开练习题
    getPublicPractice: builder.query<PracticeQuestionsResponse, {
      exam_type?: string
      limit?: number
    }>({
      query: (params) => ({
        url: '/public/practice',
        params,
      }),
    }),

    // 开始模拟考试
    startMockTest: builder.mutation<MockTestResponse, {
      exam_type: 'PTE' | 'IELTS'
      module?: string
      duration?: number
    }>({
      query: (data) => ({
        url: '/mock-test/start',
        method: 'POST',
        body: data,
      }),
    }),

    // 获取考试统计
    getExamStatistics: builder.query<ExamStatisticsResponse, void>({
      query: () => '/statistics',
      providesTags: ['ExamStats'],
    }),

    // 获取题型列表
    getQuestionTypes: builder.query<QuestionTypesResponse, void>({
      query: () => '/question-types',
    }),

    // 点赞题目
    likeQuestion: builder.mutation<{ message: string }, string>({
      query: (questionId) => ({
        url: `/questions/${questionId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['ExamPractice'],
    }),

    // ===== 考试会话管理端点 =====

    // 开始考试会话（新版，支持暂停/恢复）
    startExamSession: builder.mutation<StartExamResponse, {
      exam_type: string
      module?: string
      test_type?: string
      question_ids?: string[]
      time_limit?: number
    }>({
      query: (data) => ({
        url: '/mock-test/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ExamSessions'],
    }),

    // 获取考试会话列表
    getExamSessions: builder.query<ExamSessionsResponse, {
      status?: string
      limit?: number
    }>({
      query: (params) => ({
        url: '/sessions',
        params,
      }),
      providesTags: ['ExamSessions'],
    }),

    // 获取考试会话详情
    getExamSession: builder.query<{ session: ExamSession; progress: number }, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: (result, error, sessionId) => [{ type: 'ExamSessions', id: sessionId }],
    }),

    // 暂停考试
    pauseExamSession: builder.mutation<{ message: string; status: string; paused_at: string }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [{ type: 'ExamSessions', id: sessionId }],
    }),

    // 恢复考试
    resumeExamSession: builder.mutation<{ message: string; status: string; resumed_at: string }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [{ type: 'ExamSessions', id: sessionId }],
    }),

    // 提交答案
    submitAnswer: builder.mutation<{
      message: string
      is_correct: boolean
      correct_answer: string
      progress: number
      current_index: number
      total_questions: number
      status: string
    }, {
      sessionId: string
      question_id: string
      user_answer: string
      time_spent: number
      confidence_level: number
      is_skipped?: boolean
    }>({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/submit-answer`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [{ type: 'ExamSessions', id: sessionId }],
    }),

    // 完成考试
    completeExamSession: builder.mutation<{
      message: string
      session_id: string
      total_score: number
      score_breakdown: ScoreBreakdown
      questions_answered: number
      correct_answers: number
      wrong_answers: number
      time_spent: number
      completed_at: string
    }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: 'ExamSessions', id: sessionId },
        'ExamSessions',
        'ExamStats',
      ],
    }),

    // 获取考试报告
    getExamReport: builder.query<ExamReportResponse, string>({
      query: (sessionId) => `/sessions/${sessionId}/report`,
      providesTags: (result, error, sessionId) => [{ type: 'ExamSessions', id: sessionId }],
    }),
  }),
})

export const {
  useGetPTEPracticeQuery,
  useGetIELTSPracticeQuery,
  useGetPublicPracticeQuery,
  useStartMockTestMutation,
  useGetExamStatisticsQuery,
  useGetQuestionTypesQuery,
  useLikeQuestionMutation,
  // 考试会话管理 hooks
  useStartExamSessionMutation,
  useGetExamSessionsQuery,
  useGetExamSessionQuery,
  usePauseExamSessionMutation,
  useResumeExamSessionMutation,
  useSubmitAnswerMutation,
  useCompleteExamSessionMutation,
  useGetExamReportQuery,
} = examApi

// 导出类型供其他文件使用
export type { ExamSession, ScoreBreakdown, SectionScore, AnswerRecord, ExamReportResponse }
