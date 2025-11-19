import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import Cookies from "js-cookie";

export interface UserStats {
  user_info: {
    id: string;
    username: string;
    email: string;
    level: number;
    xp: number;
    streak: number;
    best_streak: number;
    created_at: string;
  };
  question_stats: {
    total_questions: number;
    reviewed_today: number;
    correct_today: number;
    overall_accuracy: number;
  };
  type_accuracy: {
    listening_accuracy: number;
    speaking_accuracy: number;
    reading_accuracy: number;
    writing_accuracy: number;
  };
  best_study_time: string;
  study_streak: number;
}

export interface UserProgress {
  knowledge_progress: Array<{
    user_id: string;
    node_id: string;
    mastery_level: number;
    last_reviewed: string;
    node: {
      id: string;
      name: string;
      type: string;
      category: string;
      level: number;
    };
  }>;
  daily_progress: Array<{
    date: string;
    sessions: number;
    correct: number;
    accuracy: number;
  }>;
  achievements: Array<{
    id: string;
    user_id: string;
    achievement_type: string;
    title: string;
    description: string;
    icon: string;
    is_unlocked: boolean;
    progress: number;
    target: number;
    unlocked_at?: string;
  }>;
  total_nodes: number;
  mastered_nodes: number;
}

export interface UserSettings {
  user_id: string;
  daily_goal: number;
  preferred_study_time: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  theme: string;
  language: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  daily_goal: number;
  preferred_study_time: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  theme: string;
  language: string;
}

/**
 * 从 cookie 读取 token，并生成请求头
 */
export function getAuthHeaders() {
  // 假设登录时保存的 cookie 名为 "auth_token"
  const token = Cookies.get("auth_token");

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  return {
    "Content-Type": "application/json",
  };
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    }/api/users`,
    prepareHeaders: (headers) => {
      const authHeaders = getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return headers;
    },
  }),
  tagTypes: ["UserStats", "UserProgress", "UserSettings"],
  endpoints: (builder) => ({
    getUserStats: builder.query<UserStats, void>({
      query: () => "/stats",
      providesTags: ["UserStats"],
    }),
    getUserProgress: builder.query<UserProgress, void>({
      query: () => "/progress",
      providesTags: ["UserProgress"],
    }),
    getUserSettings: builder.query<{ settings: UserSettings }, void>({
      query: () => "/settings",
      providesTags: ["UserSettings"],
    }),
    updateUserSettings: builder.mutation<
      { message: string; settings: UserSettings },
      UpdateSettingsRequest
    >({
      query: (settings) => ({
        url: "/settings",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["UserSettings"],
    }),
  }),
});

export const {
  useGetUserStatsQuery,
  useGetUserProgressQuery,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} = userApi;

// Utility functions
export const userUtils = {
  // 计算等级进度百分比
  calculateLevelProgress: (xp: number, level: number): number => {
    const baseXP = 1000; // 每级需要的基础经验
    const currentLevelXP = baseXP * level;
    const nextLevelXP = baseXP * (level + 1);
    const progressXP = xp - currentLevelXP;
    const levelRangeXP = nextLevelXP - currentLevelXP;
    return Math.max(0, Math.min(100, (progressXP / levelRangeXP) * 100));
  },

  // 获取等级名称
  getLevelName: (level: number): string => {
    if (level < 5) return "初学者";
    if (level < 10) return "学习者";
    if (level < 20) return "熟练者";
    if (level < 30) return "专家";
    if (level < 50) return "大师";
    return "传奇大师";
  },

  // 获取连击等级
  getStreakLevel: (
    streak: number
  ): { name: string; color: string; icon: string } => {
    if (streak >= 30)
      return { name: "连击之王", color: "text-purple-600", icon: "👑" };
    if (streak >= 21)
      return { name: "连击大师", color: "text-yellow-600", icon: "🔥" };
    if (streak >= 14)
      return { name: "连击专家", color: "text-orange-600", icon: "⚡" };
    if (streak >= 7)
      return { name: "连击高手", color: "text-red-600", icon: "💪" };
    if (streak >= 3)
      return { name: "连击新星", color: "text-blue-600", icon: "⭐" };
    return { name: "起步阶段", color: "text-gray-600", icon: "🌱" };
  },

  // 获取准确率等级
  getAccuracyLevel: (accuracy: number): { name: string; color: string } => {
    if (accuracy >= 95) return { name: "完美", color: "text-purple-600" };
    if (accuracy >= 90) return { name: "优秀", color: "text-green-600" };
    if (accuracy >= 80) return { name: "良好", color: "text-blue-600" };
    if (accuracy >= 70) return { name: "及格", color: "text-yellow-600" };
    if (accuracy >= 60) return { name: "待提高", color: "text-orange-600" };
    return { name: "需努力", color: "text-red-600" };
  },

  // 格式化学习时间
  formatStudyTime: (timeSlot: string): string => {
    const timeMap = {
      morning: "上午",
      afternoon: "下午",
      evening: "晚上",
    };
    return timeMap[timeSlot as keyof typeof timeMap] || timeSlot;
  },

  // 计算掌握度统计
  calculateMasteryStats: (
    knowledgeProgress: UserProgress["knowledge_progress"]
  ) => {
    const total = knowledgeProgress.length;
    const mastered = knowledgeProgress.filter(
      (p) => p.mastery_level >= 0.8
    ).length;
    const learning = knowledgeProgress.filter(
      (p) => p.mastery_level >= 0.5 && p.mastery_level < 0.8
    ).length;
    const weak = total - mastered - learning;

    return {
      total,
      mastered,
      learning,
      weak,
      masteryRate: total > 0 ? (mastered / total) * 100 : 0,
    };
  },

  // 获取推荐学习时间
  getRecommendedStudyTime: (stats: UserStats): string => {
    const { type_accuracy } = stats;
    const accuracies = [
      { type: "listening", accuracy: type_accuracy.listening_accuracy },
      { type: "speaking", accuracy: type_accuracy.speaking_accuracy },
      { type: "reading", accuracy: type_accuracy.reading_accuracy },
      { type: "writing", accuracy: type_accuracy.writing_accuracy },
    ];

    // 找出准确率最低的技能
    const weakestSkill = accuracies.sort((a, b) => a.accuracy - b.accuracy)[0];

    // 根据最佳学习时间和薄弱技能给出建议
    return `建议在${userUtils.formatStudyTime(stats.best_study_time)}重点练习${
      weakestSkill.type
    }`;
  },
};
