import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface StudyGroup {
  id: string
  name: string
  description: string
  category: string
  privacy: string
  creator_id: string
  creator?: any
  member_count: number
  max_members: number
  tags: string[]
  cover_image?: string
  created_at: string
}

interface StudyGroupPost {
  id: string
  group_id: string
  user_id: string
  user?: any
  content: string
  post_type: string
  like_count: number
  comment_count: number
  created_at: string
}

export const studyGroupApi = createApi({
  reducerPath: 'studyGroupApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/study-groups',
    credentials: 'include',
  }),
  tagTypes: ['StudyGroup', 'MyGroups', 'GroupPosts'],
  endpoints: (builder) => ({
    // 获取学习小组列表
    getStudyGroups: builder.query<{ groups: StudyGroup[]; total: number }, {
      category?: string
      privacy?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['StudyGroup'],
    }),

    // 获取学习小组详情
    getStudyGroup: builder.query<{ group: StudyGroup; is_member: boolean }, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'StudyGroup', id }],
    }),

    // 创建学习小组
    createStudyGroup: builder.mutation<{ group: StudyGroup; message: string }, {
      name: string
      description: string
      category: string
      privacy: string
      max_members?: number
      tags?: string[]
    }>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StudyGroup', 'MyGroups'],
    }),

    // 获取我的学习小组
    getMyStudyGroups: builder.query<{ groups: StudyGroup[] }, void>({
      query: () => '/my',
      providesTags: ['MyGroups'],
    }),

    // 加入学习小组
    joinStudyGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/join`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'StudyGroup', id },
        'MyGroups',
      ],
    }),

    // 离开学习小组
    leaveStudyGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'StudyGroup', id },
        'MyGroups',
      ],
    }),

    // 更新学习小组
    updateStudyGroup: builder.mutation<{ group: StudyGroup; message: string }, {
      id: string
      name?: string
      description?: string
      privacy?: string
      max_members?: number
    }>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'StudyGroup', id },
        'MyGroups',
      ],
    }),

    // 删除学习小组
    deleteStudyGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudyGroup', 'MyGroups'],
    }),

    // 获取小组帖子
    getStudyGroupPosts: builder.query<{ posts: StudyGroupPost[]; total: number }, {
      groupId: string
      limit?: number
      offset?: number
    }>({
      query: ({ groupId, ...params }) => ({
        url: `/${groupId}/posts`,
        params,
      }),
      providesTags: (result, error, { groupId }) => [
        { type: 'GroupPosts', id: groupId },
      ],
    }),

    // 创建小组帖子
    createStudyGroupPost: builder.mutation<{ post: StudyGroupPost }, {
      groupId: string
      content: string
      post_type?: string
    }>({
      query: ({ groupId, ...data }) => ({
        url: `/${groupId}/posts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { groupId }) => [
        { type: 'GroupPosts', id: groupId },
      ],
    }),
  }),
})

export const {
  useGetStudyGroupsQuery,
  useGetStudyGroupQuery,
  useCreateStudyGroupMutation,
  useGetMyStudyGroupsQuery,
  useJoinStudyGroupMutation,
  useLeaveStudyGroupMutation,
  useUpdateStudyGroupMutation,
  useDeleteStudyGroupMutation,
  useGetStudyGroupPostsQuery,
  useCreateStudyGroupPostMutation,
} = studyGroupApi
