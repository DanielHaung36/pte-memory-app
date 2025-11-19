import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Advertisement {
  id: string
  title: string
  description: string
  ad_type: string
  position: string
  image_url?: string
  video_url?: string
  target_url?: string
  reward_type?: string
  reward_amount?: number
  duration?: number
  is_active: boolean
  priority: number
  created_at: string
}

interface AdQuota {
  date: string
  daily_limit: number
  viewed_count: number
  rewarded_count: number
  remaining_count: number
}

export const advertisingApi = createApi({
  reducerPath: 'advertisingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/ads',
    credentials: 'include',
  }),
  tagTypes: ['Advertisement', 'AdQuota'],
  endpoints: (builder) => ({
    // 获取广告列表
    getAdvertisements: builder.query<{ ads: Advertisement[] }, {
      position?: string
      type?: string
    }>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['Advertisement'],
    }),

    // 记录广告观看
    recordAdView: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/view`,
        method: 'POST',
      }),
      invalidatesTags: ['AdQuota'],
    }),

    // 领取广告奖励
    claimAdReward: builder.mutation<{ reward_amount: number; message: string }, string>({
      query: (id) => ({
        url: `/${id}/reward`,
        method: 'POST',
      }),
      invalidatesTags: ['AdQuota'],
    }),

    // 获取广告配额
    getAdQuota: builder.query<{ quota: AdQuota }, void>({
      query: () => '/quota',
      providesTags: ['AdQuota'],
    }),
  }),
})

export const {
  useGetAdvertisementsQuery,
  useRecordAdViewMutation,
  useClaimAdRewardMutation,
  useGetAdQuotaQuery,
} = advertisingApi
