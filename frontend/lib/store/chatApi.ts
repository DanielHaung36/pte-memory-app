import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface ChatRoom {
  id: string
  name: string
  room_type: string
  level?: number
  description?: string
  member_count: number
  created_at: string
}

interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  user?: {
    id: string
    username: string
    avatar?: string
    level: number
  }
  content: string
  message_type: string
  like_count: number
  is_liked?: boolean
  created_at: string
}

interface PrivateChat {
  id: string
  user1_id: string
  user2_id: string
  user1?: any
  user2?: any
  last_message?: string
  last_message_at?: string
  unread_count?: number
  created_at: string
}

interface PrivateMessage {
  id: string
  chat_id: string
  sender_id: string
  sender?: any
  content: string
  is_read: boolean
  created_at: string
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/chat',
    credentials: 'include',
  }),
  tagTypes: ['ChatRoom', 'ChatMessage', 'PrivateChat', 'PrivateMessage'],
  endpoints: (builder) => ({
    // 获取等级聊天室列表
    getLevelChatRooms: builder.query<{ rooms: ChatRoom[] }, void>({
      query: () => '/rooms/level',
      providesTags: ['ChatRoom'],
    }),

    // 加入聊天室
    joinChatRoom: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/rooms/${id}/join`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // 离开聊天室
    leaveChatRoom: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/rooms/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    // 获取聊天室消息
    getChatMessages: builder.query<{ messages: ChatMessage[]; total: number }, {
      roomId: string
      limit?: number
      offset?: number
    }>({
      query: ({ roomId, ...params }) => ({
        url: `/rooms/${roomId}/messages`,
        params,
      }),
      providesTags: (result, error, { roomId }) => [
        { type: 'ChatMessage', id: roomId },
      ],
    }),

    // 发送聊天消息
    sendChatMessage: builder.mutation<{ message: ChatMessage }, {
      roomId: string
      content: string
      message_type?: string
    }>({
      query: ({ roomId, ...data }) => ({
        url: `/rooms/${roomId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'ChatMessage', id: roomId },
      ],
    }),

    // 获取私聊列表
    getPrivateChats: builder.query<{ chats: PrivateChat[] }, void>({
      query: () => '/private',
      providesTags: ['PrivateChat'],
    }),

    // 开始私聊
    startPrivateChat: builder.mutation<{ chat: PrivateChat }, { user_id: string }>({
      query: (data) => ({
        url: '/private/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PrivateChat'],
    }),

    // 获取私聊消息
    getPrivateMessages: builder.query<{ messages: PrivateMessage[]; total: number }, {
      chatId: string
      limit?: number
      offset?: number
    }>({
      query: ({ chatId, ...params }) => ({
        url: `/private/${chatId}/messages`,
        params,
      }),
      providesTags: (result, error, { chatId }) => [
        { type: 'PrivateMessage', id: chatId },
      ],
    }),

    // 发送私聊消息
    sendPrivateMessage: builder.mutation<{ message: PrivateMessage }, {
      chatId: string
      content: string
    }>({
      query: ({ chatId, ...data }) => ({
        url: `/private/${chatId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: 'PrivateMessage', id: chatId },
        'PrivateChat',
      ],
    }),
  }),
})

export const {
  useGetLevelChatRoomsQuery,
  useJoinChatRoomMutation,
  useLeaveChatRoomMutation,
  useGetChatMessagesQuery,
  useSendChatMessageMutation,
  useGetPrivateChatsQuery,
  useStartPrivateChatMutation,
  useGetPrivateMessagesQuery,
  useSendPrivateMessageMutation,
} = chatApi
