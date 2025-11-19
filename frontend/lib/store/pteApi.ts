import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface PTEModule {
  id: string;
  code: string;
  name: string;
  name_cn: string;
  description: string;
  icon_url?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  question_types?: PTEQuestionType[];
}

export interface PTEQuestionType {
  id: string;
  module_id: string;
  code: string;
  name: string;
  name_cn: string;
  description: string;
  scoring_info: string;
  time_limit: number;
  question_count: number;
  total_questions: number;
  score_weight: string;
  skills_tested: string[];
  tips: string[];
  common_mistakes: string[];
  icon_url?: string;
  color: string;
  sample_question_id?: string;
  video_tutorial_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module?: PTEModule;
}

export interface PTEModuleStats {
  id: string;
  user_id: string;
  module_id: string;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  accuracy_rate: number;
  average_score: number;
  total_time_spent: number;
  last_practice_date?: string;
  mastery_level: number;
  created_at: string;
  updated_at: string;
  module?: PTEModule;
}

export interface PTEQuestionTypeStats {
  id: string;
  user_id: string;
  question_type_id: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_time: number;
  best_score: number;
  recent_score: number;
  progress_rate: number;
  last_practice_date?: string;
  mastery_level: number;
  created_at: string;
  updated_at: string;
  question_type?: PTEQuestionType;
}

export interface ModuleOverview {
  module: PTEModule;
  stats: PTEModuleStats | null;
}

export interface StartPracticeRequest {
  question_type_id: string;
  mode: 'practice' | 'exam';
  question_count: number;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  question_type_id: string;
  mode: string;
  questions: any[];
  start_time: string;
  end_time?: string;
  total_questions: number;
  correct_answers: number;
  score: number;
}

export interface SubmitAnswerRequest {
  session_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  response_time: number;
  confidence_level: number;
  score: number;
}

export const pteApi = createApi({
  reducerPath: 'pteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    credentials: 'include', // 使用HTTP-only cookies进行认证
    prepareHeaders: (headers) => {
      return headers;
    },
  }),
  tagTypes: ['PTEModule', 'PTEQuestionType', 'PTEStats'],
  endpoints: (builder) => ({
    // 获取所有模块
    getAllModules: builder.query<{ modules: PTEModule[]; count: number }, void>({
      query: () => '/pte/modules',
      providesTags: [{ type: 'PTEModule', id: 'LIST' }],
    }),

    // 根据代码获取模块
    getModuleByCode: builder.query<{ module: PTEModule }, string>({
      query: (code) => `/pte/modules/by-code/${code}`,
      providesTags: (result, error, code) => [{ type: 'PTEModule', id: code }],
    }),

    // 获取模块下的题型
    getQuestionTypesByModule: builder.query<{ question_types: PTEQuestionType[]; count: number }, string>({
      query: (moduleId) => `/pte/modules/${moduleId}/types`,
      providesTags: [{ type: 'PTEQuestionType', id: 'LIST' }],
    }),

    // 根据代码获取题型
    getQuestionTypeByCode: builder.query<{ question_type: PTEQuestionType }, string>({
      query: (code) => `/pte/types/${code}`,
      providesTags: (result, error, code) => [{ type: 'PTEQuestionType', id: code }],
    }),

    // 获取模块概览（包含统计）
    getModuleOverview: builder.query<{ overview: ModuleOverview[]; count: number }, void>({
      query: () => '/pte/stats/overview',
      providesTags: [{ type: 'PTEStats', id: 'OVERVIEW' }],
    }),

    // 获取用户的模块统计
    getUserModuleStats: builder.query<{ stats: PTEModuleStats }, string>({
      query: (moduleId) => `/pte/stats/module/${moduleId}`,
      providesTags: (result, error, moduleId) => [{ type: 'PTEStats', id: moduleId }],
    }),

    // 获取用户所有模块统计
    getUserAllModuleStats: builder.query<{ stats: PTEModuleStats[]; count: number }, void>({
      query: () => '/pte/stats/modules',
      providesTags: [{ type: 'PTEStats', id: 'ALL' }],
    }),

    // 获取用户题型统计
    getUserQuestionTypeStats: builder.query<{ stats: PTEQuestionTypeStats }, string>({
      query: (questionTypeId) => `/pte/stats/type/${questionTypeId}`,
      providesTags: (result, error, id) => [{ type: 'PTEStats', id }],
    }),

    // 根据题型获取题目
    getQuestionsByType: builder.query<{ questions: any[]; total: number; limit: number; offset: number }, { typeCode: string; limit?: number; offset?: number }>({
      query: ({ typeCode, limit = 20, offset = 0 }) =>
        `/pte/questions/${typeCode}?limit=${limit}&offset=${offset}`,
    }),

    // 开始练习会话
    startPracticeSession: builder.mutation<{ session: PracticeSession; message: string }, StartPracticeRequest>({
      query: (body) => ({
        url: '/pte/practice/start',
        method: 'POST',
        body,
      }),
    }),

    // 提交练习答案
    submitPracticeAnswer: builder.mutation<{ message: string; is_correct: boolean }, SubmitAnswerRequest>({
      query: (body) => ({
        url: '/pte/practice/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'PTEStats', id: 'OVERVIEW' }, { type: 'PTEStats', id: 'ALL' }],
    }),
  }),
});

export const {
  useGetAllModulesQuery,
  useGetModuleByCodeQuery,
  useGetQuestionTypesByModuleQuery,
  useGetQuestionTypeByCodeQuery,
  useGetModuleOverviewQuery,
  useGetUserModuleStatsQuery,
  useGetUserAllModuleStatsQuery,
  useGetUserQuestionTypeStatsQuery,
  useGetQuestionsByTypeQuery,
  useStartPracticeSessionMutation,
  useSubmitPracticeAnswerMutation,
} = pteApi;
