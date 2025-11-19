import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface AdminStats {
  total_users: number
  active_users: number
  total_questions: number
  pending_questions: number
  total_reviews: number
  total_reports: number
}

interface User {
  id: string
  username: string
  email: string
  level: number
  xp: number
  is_banned: boolean
  role: string
  created_at: string
}

interface QuestionReview {
  id: string
  question_id: string
  question?: any
  reviewer_id: string
  status: string
  review_note?: string
  created_at: string
}

interface UserReport {
  id: string
  reporter_id: string
  reporter?: any
  target_type: string
  target_id: string
  reason: string
  description?: string
  status: string
  processed_by?: string
  processed_at?: string
  created_at: string
}

interface SystemConfig {
  key: string
  value: string
  description?: string
  updated_at: string
}

interface AdminLog {
  id: string
  admin_id: string
  admin?: any
  action: string
  target_type?: string
  target_id?: string
  details?: any
  created_at: string
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin',
    credentials: 'include',
  }),
  tagTypes: ['AdminStats', 'Users', 'PendingQuestions', 'Reports', 'SystemConfigs', 'AdminLogs'],
  endpoints: (builder) => ({
    // 获取管理统计
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/stats',
      providesTags: ['AdminStats'],
    }),

    // 用户管理
    getAllUsers: builder.query<{ users: User[]; total: number }, {
      limit?: number
      offset?: number
      search?: string
    }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['Users'],
    }),

    getUserDetail: builder.query<{ user: User; stats: any }, string>({
      query: (id) => `/users/${id}`,
    }),

    banUser: builder.mutation<{ message: string }, { userId: string; reason: string }>({
      query: ({ userId, ...data }) => ({
        url: `/users/${userId}/ban`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users', 'AdminLogs'],
    }),

    unbanUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `/users/${userId}/unban`,
        method: 'POST',
      }),
      invalidatesTags: ['Users', 'AdminLogs'],
    }),

    updateUserRole: builder.mutation<{ message: string }, { userId: string; role: string }>({
      query: ({ userId, ...data }) => ({
        url: `/users/${userId}/role`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users', 'AdminLogs'],
    }),

    // 题目审核
    getPendingQuestions: builder.query<{ questions: any[]; total: number }, {
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/questions/pending',
        params,
      }),
      providesTags: ['PendingQuestions'],
    }),

    approveQuestion: builder.mutation<{ message: string }, { questionId: string; note?: string }>({
      query: ({ questionId, ...data }) => ({
        url: `/questions/${questionId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PendingQuestions', 'AdminLogs'],
    }),

    rejectQuestion: builder.mutation<{ message: string }, { questionId: string; reason: string }>({
      query: ({ questionId, ...data }) => ({
        url: `/questions/${questionId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PendingQuestions', 'AdminLogs'],
    }),

    batchReviewQuestions: builder.mutation<{ message: string }, {
      question_ids: string[]
      action: 'approve' | 'reject'
      note?: string
    }>({
      query: (data) => ({
        url: '/questions/batch-review',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PendingQuestions', 'AdminLogs'],
    }),

    // 举报处理
    getUserReports: builder.query<{ reports: UserReport[]; total: number }, {
      status?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/reports',
        params,
      }),
      providesTags: ['Reports'],
    }),

    processReport: builder.mutation<{ message: string }, {
      reportId: string
      action: string
      note?: string
    }>({
      query: ({ reportId, ...data }) => ({
        url: `/reports/${reportId}/process`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reports', 'AdminLogs'],
    }),

    // 系统配置
    getSystemConfigs: builder.query<{ configs: SystemConfig[] }, void>({
      query: () => '/configs',
      providesTags: ['SystemConfigs'],
    }),

    createSystemConfig: builder.mutation<{ config: SystemConfig }, {
      key: string
      value: string
      description?: string
    }>({
      query: (data) => ({
        url: '/configs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SystemConfigs', 'AdminLogs'],
    }),

    updateSystemConfig: builder.mutation<{ config: SystemConfig }, {
      key: string
      value: string
    }>({
      query: ({ key, ...data }) => ({
        url: `/configs/${key}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SystemConfigs', 'AdminLogs'],
    }),

    // 操作日志
    getAdminLogs: builder.query<{ logs: AdminLog[]; total: number }, {
      admin_id?: string
      action?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/logs',
        params,
      }),
      providesTags: ['AdminLogs'],
    }),

    // 广告管理
    createAdvertisement: builder.mutation<{ ad: any; message: string }, {
      title: string
      description: string
      ad_type: string
      position: string
      reward_type?: string
      reward_amount?: number
    }>({
      query: (data) => ({
        url: '/ads',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminLogs'],
    }),

    updateAdvertisement: builder.mutation<{ ad: any; message: string }, {
      adId: string
      [key: string]: any
    }>({
      query: ({ adId, ...data }) => ({
        url: `/ads/${adId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminLogs'],
    }),

    getAdStatistics: builder.query<any, string>({
      query: (adId) => `/ads/${adId}/stats`,
    }),

    // 推送通知管理
    sendBroadcastPush: builder.mutation<{ message: string }, {
      title: string
      body: string
      target_group?: string
    }>({
      query: (data) => ({
        url: '/push/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminLogs'],
    }),

    getPushTemplates: builder.query<{ templates: any[] }, void>({
      query: () => '/push/templates',
    }),

    createPushTemplate: builder.mutation<{ template: any }, {
      name: string
      title_template: string
      body_template: string
      category: string
    }>({
      query: (data) => ({
        url: '/push/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminLogs'],
    }),

    updatePushTemplate: builder.mutation<{ template: any }, {
      templateId: string
      [key: string]: any
    }>({
      query: ({ templateId, ...data }) => ({
        url: `/push/templates/${templateId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminLogs'],
    }),

    getPushStats: builder.query<any, void>({
      query: () => '/push/stats',
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetAllUsersQuery,
  useGetUserDetailQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useUpdateUserRoleMutation,
  useGetPendingQuestionsQuery,
  useApproveQuestionMutation,
  useRejectQuestionMutation,
  useBatchReviewQuestionsMutation,
  useGetUserReportsQuery,
  useProcessReportMutation,
  useGetSystemConfigsQuery,
  useCreateSystemConfigMutation,
  useUpdateSystemConfigMutation,
  useGetAdminLogsQuery,
  useCreateAdvertisementMutation,
  useUpdateAdvertisementMutation,
  useGetAdStatisticsQuery,
  useSendBroadcastPushMutation,
  useGetPushTemplatesQuery,
  useCreatePushTemplateMutation,
  useUpdatePushTemplateMutation,
  useGetPushStatsQuery,
} = adminApi
