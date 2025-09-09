import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from './index'

interface GameStats {
  total_games: number
  total_score: number
  average_score: number
  best_score: number
  games_today: number
  current_streak: number
  best_streak: number
  accuracy_rate: number
}

interface GameSession {
  id: string
  user_id: string
  game_type: string
  status: 'active' | 'completed' | 'abandoned'
  score: number
  max_score: number
  accuracy: number
  time_taken: number
  questions_answered: number
  correct_answers: number
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}

interface WordPair {
  id: string
  english: string
  chinese: string
  category?: string
  difficulty: number
  audio_url?: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  requirement: number
  progress: number
  is_unlocked: boolean
  unlocked_at?: string
}

interface StartGameSessionRequest {
  game_type: string
  difficulty?: number
  category?: string
}

interface CompleteGameSessionRequest {
  score: number
  max_score: number
  accuracy: number
  time_taken: number
  questions_answered: number
  correct_answers: number
  game_data?: any
}

export const gamesApi = createApi({
  reducerPath: 'gamesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:8081/api/games' : '/api/games',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['GameStats', 'GameSession', 'WordPair', 'Achievement'],
  endpoints: (builder) => ({
    // 获取游戏统计
    getGameStats: builder.query<{ stats: GameStats }, void>({
      query: () => '/stats',
      providesTags: [{ type: 'GameStats' }],
    }),

    // 获取最近游戏
    getRecentGames: builder.query<{ games: GameSession[] }, {
      limit?: number
      game_type?: string
    }>({
      query: (params = {}) => ({
        url: '/recent',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.games.map(({ id }) => ({ type: 'GameSession' as const, id })),
              { type: 'GameSession', id: 'LIST' },
            ]
          : [{ type: 'GameSession', id: 'LIST' }],
    }),

    // 获取成就
    getAchievements: builder.query<{ achievements: Achievement[] }, void>({
      query: () => '/achievements',
      providesTags: [{ type: 'Achievement', id: 'LIST' }],
    }),

    // 获取单词对
    getWordPairs: builder.query<{ words: WordPair[] }, {
      category?: string
      difficulty?: number
      limit?: number
    }>({
      query: (params = {}) => ({
        url: '/words',
        params,
      }),
      providesTags: [{ type: 'WordPair', id: 'LIST' }],
    }),

    // 开始游戏会话
    startGameSession: builder.mutation<{ session: GameSession }, StartGameSessionRequest>({
      query: (data) => ({
        url: '/sessions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'GameSession', id: 'LIST' },
        { type: 'GameStats' }
      ],
    }),

    // 完成游戏会话
    completeGameSession: builder.mutation<{ session: GameSession }, {
      id: string
      data: CompleteGameSessionRequest
    }>({
      query: ({ id, data }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'GameSession', id },
        { type: 'GameSession', id: 'LIST' },
        { type: 'GameStats' },
        { type: 'Achievement', id: 'LIST' }
      ],
    }),

    // 获取游戏会话详情
    getGameSession: builder.query<{ session: GameSession }, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'GameSession', id }],
    }),
  }),
})

export const {
  useGetGameStatsQuery,
  useGetRecentGamesQuery,
  useGetAchievementsQuery,
  useGetWordPairsQuery,
  useStartGameSessionMutation,
  useCompleteGameSessionMutation,
  useGetGameSessionQuery,
} = gamesApi