import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// 导入结果类型
interface ImportResult {
  total_rows: number
  success_count: number
  error_count: number
  errors: string[]
  success_ids: string[]
}

// 预览响应类型
interface PreviewResponse {
  message: string
  total_rows: number
  valid_count: number
  invalid_count: number
  errors: string[]
  preview_data: any[]
}

// 批量上传响应
interface BatchUploadResponse {
  message: string
  total: number
  success_count: number
  results: Array<{
    filename: string
    success: boolean
    url?: string
    saved_as?: string
    error?: string
  }>
  audio_map: Record<string, string>
}

export const importApi = createApi({
  reducerPath: 'importApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include',
  }),
  tagTypes: ['Import'],
  endpoints: (builder) => ({
    // 预览题目导入
    previewQuestionsImport: builder.mutation<PreviewResponse, FormData>({
      query: (formData) => ({
        url: '/import/questions/preview',
        method: 'POST',
        body: formData,
      }),
    }),

    // 执行题目导入
    executeQuestionsImport: builder.mutation<{ message: string; result: ImportResult }, FormData>({
      query: (formData) => ({
        url: '/import/questions/execute',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Import'],
    }),

    // 下载题目导入模板
    downloadQuestionTemplate: builder.query<Blob, void>({
      query: () => ({
        url: '/import/template/questions',
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    // 预览错题导入
    previewWrongQuestionsImport: builder.mutation<PreviewResponse, FormData>({
      query: (formData) => ({
        url: '/import/wrong-questions/preview',
        method: 'POST',
        body: formData,
      }),
    }),

    // 执行错题导入
    executeWrongQuestionsImport: builder.mutation<{ message: string; result: ImportResult }, FormData>({
      query: (formData) => ({
        url: '/import/wrong-questions/execute',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Import'],
    }),

    // 下载错题导入模板
    downloadWrongQuestionTemplate: builder.query<Blob, void>({
      query: () => ({
        url: '/import/template/wrong-questions',
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    // 批量上传音频
    batchUploadAudio: builder.mutation<BatchUploadResponse, FormData>({
      query: (formData) => ({
        url: '/import/audio/batch',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
})

export const {
  usePreviewQuestionsImportMutation,
  useExecuteQuestionsImportMutation,
  useLazyDownloadQuestionTemplateQuery,
  usePreviewWrongQuestionsImportMutation,
  useExecuteWrongQuestionsImportMutation,
  useLazyDownloadWrongQuestionTemplateQuery,
  useBatchUploadAudioMutation,
} = importApi
