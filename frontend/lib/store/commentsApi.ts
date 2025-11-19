import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Comment {
  id: string;
  user_id: string;
  question_id: string;
  parent_id?: string;
  comment_type: 'text' | 'audio' | 'note' | 'mixed';
  content: string;
  audio_url?: string;
  duration?: number;
  note_title?: string;
  note_tags?: string[];
  is_private: boolean;
  like_count: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar: string;
    level: number;
  };
  replies?: Comment[];
}

export interface CreateCommentRequest {
  question_id: string;
  parent_id?: string;
  comment_type: 'text' | 'audio' | 'note' | 'mixed';
  content: string;
  audio_url?: string;
  duration?: number;
  note_title?: string;
  note_tags?: string[];
  is_private?: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
}

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    credentials: 'include', // 使用HTTP-only cookies进行认证
    prepareHeaders: (headers) => {
      return headers;
    },
  }),
  tagTypes: ['Comment'],
  endpoints: (builder) => ({
    // 获取题目的评论列表
    getCommentsByQuestion: builder.query<CommentsResponse, { questionId: string; limit?: number; offset?: number }>({
      query: ({ questionId, limit = 20, offset = 0 }) =>
        `/comments/question/${questionId}?limit=${limit}&offset=${offset}`,
      providesTags: (result) =>
        result
          ? [
              ...result.comments.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: 'LIST' },
            ]
          : [{ type: 'Comment', id: 'LIST' }],
    }),

    // 获取单个评论
    getComment: builder.query<{ comment: Comment }, string>({
      query: (id) => `/comments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Comment', id }],
    }),

    // 创建评论
    createComment: builder.mutation<{ comment: Comment; message: string }, CreateCommentRequest>({
      query: (body) => ({
        url: '/comments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Comment', id: 'LIST' }],
    }),

    // 更新评论
    updateComment: builder.mutation<{ comment: Comment; message: string }, { id: string; data: Partial<CreateCommentRequest> }>({
      query: ({ id, data }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Comment', id }],
    }),

    // 删除评论
    deleteComment: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Comment', id: 'LIST' }],
    }),

    // 点赞评论
    likeComment: builder.mutation<{ message: string; like_count: number }, string>({
      query: (id) => ({
        url: `/comments/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Comment', id }],
    }),

    // 取消点赞
    unlikeComment: builder.mutation<{ message: string; like_count: number }, string>({
      query: (id) => ({
        url: `/comments/${id}/like`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Comment', id }],
    }),

    // 置顶评论
    pinComment: builder.mutation<{ message: string; is_pinned: boolean }, string>({
      query: (id) => ({
        url: `/comments/${id}/pin`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Comment', id: 'LIST' }],
    }),

    // 获取我的评论
    getMyComments: builder.query<CommentsResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => `/comments/my?limit=${limit}&offset=${offset}`,
      providesTags: [{ type: 'Comment', id: 'MY_LIST' }],
    }),
  }),
});

export const {
  useGetCommentsByQuestionQuery,
  useGetCommentQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  usePinCommentMutation,
  useGetMyCommentsQuery,
} = commentsApi;
