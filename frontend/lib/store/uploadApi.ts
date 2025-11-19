import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/upload',
    credentials: 'include',
  }),
  tagTypes: ['Upload'],
  endpoints: (builder) => ({
    // 上传用户头像
    uploadAvatar: builder.mutation<{ url: string; message: string }, FormData>({
      query: (formData) => ({
        url: '/avatar',
        method: 'POST',
        body: formData,
      }),
    }),

    // 上传题目音频
    uploadQuestionAudio: builder.mutation<{ url: string; message: string }, FormData>({
      query: (formData) => ({
        url: '/audio',
        method: 'POST',
        body: formData,
      }),
    }),

    // 上传题目图片
    uploadQuestionImage: builder.mutation<{ url: string; message: string }, FormData>({
      query: (formData) => ({
        url: '/image',
        method: 'POST',
        body: formData,
      }),
    }),

    // 删除文件
    deleteFile: builder.mutation<{ message: string }, string>({
      query: (fileId) => ({
        url: `/${fileId}`,
        method: 'DELETE',
      }),
    }),
  }),
})

export const {
  useUploadAvatarMutation,
  useUploadQuestionAudioMutation,
  useUploadQuestionImageMutation,
  useDeleteFileMutation,
} = uploadApi
