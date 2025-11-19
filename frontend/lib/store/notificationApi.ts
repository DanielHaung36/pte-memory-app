import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Notification {
  id: string
  user_id: string
  type: string
  category: string
  title: string
  message: string
  action_url?: string
  icon_url?: string
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
}

interface ReminderSettings {
  id: string
  user_id: string
  daily_reminder_enabled: boolean
  daily_reminder_time: string
  review_reminder_enabled: boolean
  review_reminder_advance: number
  streak_reminder_enabled: boolean
  goal_reminder_enabled: boolean
  email_notification_enabled: boolean
  push_notification_enabled: boolean
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
  }),
  tagTypes: ['Notification', 'ReminderSettings'],
  endpoints: (builder) => ({
    // 获取通知列表
    getNotifications: builder.query<{ notifications: Notification[]; total: number }, {
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),

    // 获取未读通知数量
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    // 按类型获取通知
    getNotificationsByType: builder.query<{ notifications: Notification[] }, string>({
      query: (type) => `/notifications/type/${type}`,
      providesTags: ['Notification'],
    }),

    // 标记通知为已读
    markNotificationRead: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 标记所有通知为已读
    markAllNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 删除通知
    deleteNotification: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 清空所有通知
    clearAllNotifications: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 测试通知
    testNotification: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/test',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 获取提醒设置
    getReminderSettings: builder.query<{ settings: ReminderSettings }, void>({
      query: () => '/reminders/settings',
      providesTags: ['ReminderSettings'],
    }),

    // 更新提醒设置
    updateReminderSettings: builder.mutation<{ message: string }, Partial<ReminderSettings>>({
      query: (data) => ({
        url: '/reminders/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ReminderSettings'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useGetNotificationsByTypeQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useTestNotificationMutation,
  useGetReminderSettingsQuery,
  useUpdateReminderSettingsMutation,
} = notificationApi
