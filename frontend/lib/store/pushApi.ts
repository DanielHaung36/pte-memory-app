import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface DeviceToken {
  id: string
  user_id: string
  token: string
  device_type: string
  device_name?: string
  is_active: boolean
  last_used_at: string
  created_at: string
}

interface PushSettings {
  review_reminders: boolean
  achievement_notifications: boolean
  social_notifications: boolean
  streak_reminders: boolean
  daily_report: boolean
  marketing_notifications: boolean
}

interface PushNotification {
  id: string
  title: string
  body: string
  data?: any
  sent_at: string
  status: string
}

export const pushApi = createApi({
  reducerPath: 'pushApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/push',
    credentials: 'include',
  }),
  tagTypes: ['DeviceToken', 'PushSettings', 'PushHistory'],
  endpoints: (builder) => ({
    // 注册设备Token
    registerDeviceToken: builder.mutation<{ message: string }, {
      token: string
      device_type: string
      device_name?: string
    }>({
      query: (data) => ({
        url: '/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DeviceToken'],
    }),

    // 注销设备Token
    unregisterDeviceToken: builder.mutation<{ message: string }, string>({
      query: (token) => ({
        url: '/unregister',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['DeviceToken'],
    }),

    // 获取用户设备列表
    getUserDevices: builder.query<{ devices: DeviceToken[] }, void>({
      query: () => '/devices',
      providesTags: ['DeviceToken'],
    }),

    // 获取推送设置
    getPushSettings: builder.query<{ settings: PushSettings }, void>({
      query: () => '/settings',
      providesTags: ['PushSettings'],
    }),

    // 更新推送设置
    updatePushSettings: builder.mutation<{ message: string }, Partial<PushSettings>>({
      query: (data) => ({
        url: '/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PushSettings'],
    }),

    // 获取推送历史
    getPushHistory: builder.query<{ notifications: PushNotification[]; total: number }, {
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/history',
        params,
      }),
      providesTags: ['PushHistory'],
    }),

    // 发送测试推送
    sendTestPush: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/test',
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useRegisterDeviceTokenMutation,
  useUnregisterDeviceTokenMutation,
  useGetUserDevicesQuery,
  useGetPushSettingsQuery,
  useUpdatePushSettingsMutation,
  useGetPushHistoryQuery,
  useSendTestPushMutation,
} = pushApi
