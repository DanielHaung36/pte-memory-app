import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BACKEND_URL;

// Social API types
export interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: 'study_session' | 'achievement' | 'milestone' | 'tip' | 'question' | 'celebration';
  title?: string;
  images?: string[];
  tags?: string[];
  privacy: 'public' | 'friends' | 'private';
  study_data?: StudySessionData;
  achievement_data?: AchievementData;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface StudySessionData {
  questions_completed: number;
  accuracy: number;
  time_spent: number; // in minutes
  subject: string;
  difficulty_level: number;
  streak_count: number;
  xp_gained: number;
  improvements?: string[];
}

export interface AchievementData {
  achievement_id: string;
  name: string;
  description: string;
  badge: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  avatar?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  reply_to_user_id?: string;
  content: string;
  images?: string[];
  likes_count: number;
  dislikes_count: number;
  user: User;
  reply_to_user?: User;
  replies?: Comment[];
  is_liked?: boolean;
  is_disliked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostWithStatus {
  post: Post;
  is_liked: boolean;
  is_bookmarked: boolean;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
}

export interface CreatePostRequest {
  content: string;
  post_type?: string;
  title?: string;
  images?: string[];
  tags?: string[];
  privacy?: string;
  study_data?: StudySessionData;
  achievement_data?: AchievementData;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: string;
  reply_to_user_id?: string;
  images?: string[];
}

// Create Social API
export const socialApi = createApi({
  reducerPath: 'socialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/social`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Post', 'Comment', 'Follow', 'Bookmark'],
  endpoints: (builder) => ({
    // Posts
    createPost: builder.mutation<{ message: string; post: Post }, CreatePostRequest>({
      query: (post) => ({
        url: '/posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),

    getFeed: builder.query<{ posts: PostWithStatus[]; count: number }, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/feed',
        params: { limit, offset },
      }),
      providesTags: ['Post'],
    }),

    getPublicFeed: builder.query<{ posts: PostWithStatus[]; count: number }, { 
      limit?: number; 
      offset?: number; 
      type?: string;
    }>({
      query: ({ limit = 20, offset = 0, type = 'all' } = {}) => ({
        url: '/feed/public',
        params: { limit, offset, type },
      }),
      providesTags: ['Post'],
    }),

    getUserPosts: builder.query<{ posts: PostWithStatus[]; count: number }, {
      userId: string;
      limit?: number;
      offset?: number;
    }>({
      query: ({ userId, limit = 20, offset = 0 }) => ({
        url: `/posts/user/${userId}`,
        params: { limit, offset },
      }),
      providesTags: ['Post'],
    }),

    likePost: builder.mutation<{ message: string; is_liked: boolean }, string>({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Post'],
    }),

    bookmarkPost: builder.mutation<{ message: string; is_bookmarked: boolean }, string>({
      query: (postId) => ({
        url: `/posts/${postId}/bookmark`,
        method: 'POST',
      }),
      invalidatesTags: ['Post', 'Bookmark'],
    }),

    getBookmarks: builder.query<{ bookmarks: PostWithStatus[]; count: number }, {
      limit?: number;
      offset?: number;
    }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/bookmarks',
        params: { limit, offset },
      }),
      providesTags: ['Bookmark'],
    }),

    // Comments
    createComment: builder.mutation<{ message: string; comment: Comment }, {
      postId: string;
      data: CreateCommentRequest;
    }>({
      query: ({ postId, data }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Comment', 'Post'],
    }),

    getComments: builder.query<{ comments: Comment[]; count: number }, string>({
      query: (postId) => ({
        url: `/posts/${postId}/comments`,
      }),
      providesTags: ['Comment'],
    }),

    likeComment: builder.mutation<{ message: string; is_liked: boolean }, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Comment'],
    }),

    dislikeComment: builder.mutation<{ message: string; is_disliked: boolean }, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}/dislike`,
        method: 'POST',
      }),
      invalidatesTags: ['Comment'],
    }),

    // Following
    followUser: builder.mutation<{ message: string; is_following: boolean }, string>({
      query: (userId) => ({
        url: `/users/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: ['Follow'],
    }),

    getFollowStats: builder.query<FollowStats, string>({
      query: (userId) => ({
        url: `/users/${userId}/follow-stats`,
      }),
      providesTags: ['Follow'],
    }),
  }),
});

// Export hooks
export const {
  useCreatePostMutation,
  useGetFeedQuery,
  useGetPublicFeedQuery,
  useGetUserPostsQuery,
  useLikePostMutation,
  useBookmarkPostMutation,
  useGetBookmarksQuery,
  useCreateCommentMutation,
  useGetCommentsQuery,
  useLikeCommentMutation,
  useDislikeCommentMutation,
  useFollowUserMutation,
  useGetFollowStatsQuery,
} = socialApi;

// Utility functions for social features
export const socialUtils = {
  // Format post type display text
  getPostTypeText: (type: string): string => {
    const typeMap = {
      'study_session': '学习记录',
      'achievement': '获得成就',
      'milestone': '达成里程碑',
      'tip': '分享技巧',
      'question': '提出问题',
      'celebration': '庆祝时刻',
    };
    return typeMap[type as keyof typeof typeMap] || '学习动态';
  },

  // Get post type icon
  getPostTypeIcon: (type: string): string => {
    const iconMap = {
      'study_session': '📚',
      'achievement': '🏆',
      'milestone': '🎯',
      'tip': '⭐',
      'question': '❓',
      'celebration': '🎉',
    };
    return iconMap[type as keyof typeof iconMap] || '📝';
  },

  // Format time ago
  formatTimeAgo: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}周前`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}个月前`;
  },

  // Get achievement rarity color
  getAchievementRarityColor: (rarity: string): string => {
    const colorMap = {
      'common': 'bg-gray-100 text-gray-600',
      'rare': 'bg-blue-100 text-blue-600',
      'epic': 'bg-purple-100 text-purple-600',
      'legendary': 'bg-yellow-100 text-yellow-600',
    };
    return colorMap[rarity as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  },

  // Format study time
  formatStudyTime: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  },

  // Generate auto post from study session
  generateStudySessionPost: (studyData: StudySessionData): CreatePostRequest => {
    const accuracy = Math.round(studyData.accuracy);
    const timeSpent = socialUtils.formatStudyTime(studyData.time_spent);
    
    let content = `今天完成了 ${studyData.questions_completed} 道${studyData.subject}题目，准确率达到 ${accuracy}%！`;
    
    if (studyData.time_spent > 0) {
      content += `学习时长 ${timeSpent}`;
    }
    
    if (studyData.streak_count > 0) {
      content += `，当前连击 ${studyData.streak_count} 次`;
    }
    
    if (accuracy >= 90) {
      content += ' 🎉 表现优秀！';
    } else if (accuracy >= 80) {
      content += ' 👍 继续保持！';
    } else {
      content += ' 💪 继续努力！';
    }

    return {
      content,
      post_type: 'study_session',
      study_data: studyData,
      tags: [studyData.subject, '学习记录'],
      privacy: 'public',
    };
  },

  // Generate auto post from achievement
  generateAchievementPost: (achievementData: AchievementData): CreatePostRequest => {
    const content = `🎉 解锁新成就：${achievementData.name}！${achievementData.description}`;
    
    return {
      content,
      post_type: 'achievement',
      achievement_data: achievementData,
      tags: ['成就', achievementData.category],
      privacy: 'public',
    };
  },
};