import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface QuestionLibrary {
  id: string
  name: string
  description: string
  category: string
  creator_id: string
  creator?: {
    id: string
    username: string
    avatar?: string
  }
  question_count: number
  downloads: number
  rating: number
  rating_count: number
  is_published: boolean
  is_free: boolean
  price: number
  verification_status: string
  created_at: string
  updated_at: string
}

interface LibraryListResponse {
  libraries: QuestionLibrary[]
  total: number
  limit: number
  offset: number
}

interface LibraryDetailResponse {
  library: QuestionLibrary
  questions: any[]
  user_rating?: number
  is_downloaded: boolean
}

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/library',
    credentials: 'include',
  }),
  tagTypes: ['Library', 'MyLibraries'],
  endpoints: (builder) => ({
    // 获取公开题库列表
    getPublicLibraries: builder.query<LibraryListResponse, {
      category?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '/public',
        params,
      }),
      providesTags: ['Library'],
    }),

    // 获取题库详情
    getLibraryDetail: builder.query<LibraryDetailResponse, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Library', id }],
    }),

    // 创建题库
    createLibrary: builder.mutation<{ library: QuestionLibrary; message: string }, {
      name: string
      description: string
      category: string
      is_free: boolean
      price?: number
    }>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MyLibraries'],
    }),

    // 获取我的题库
    getMyLibraries: builder.query<{ libraries: QuestionLibrary[] }, void>({
      query: () => '/my',
      providesTags: ['MyLibraries'],
    }),

    // 下载题库
    downloadLibrary: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/download`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Library', id },
        'MyLibraries',
      ],
    }),

    // 评分题库
    rateLibrary: builder.mutation<{ message: string }, {
      id: string
      rating: number
      review?: string
    }>({
      query: ({ id, ...data }) => ({
        url: `/${id}/rate`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Library', id },
        'Library',
      ],
    }),
  }),
})

export const {
  useGetPublicLibrariesQuery,
  useGetLibraryDetailQuery,
  useCreateLibraryMutation,
  useGetMyLibrariesQuery,
  useDownloadLibraryMutation,
  useRateLibraryMutation,
} = libraryApi
