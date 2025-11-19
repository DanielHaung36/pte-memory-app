import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Analytics API types
export interface DashboardStats {
  user: any;
  totalQuestions: number;
  dueQuestions: number;
  overdueQuestions: number;
  masteredQuestions: number;
  wrongQuestions: number;
  unresolvedWrong: number;
  todayReviewed: number;
  weeklyReviewed: number;
  monthlyReviewed: number;
  currentStreak: number;
  bestStreak: number;
  avgAccuracy: number;
  recentAccuracy: number;
  studyTime: StudyTimeStats;
  typePerformance: TypePerformance[];
  difficultyStats: DifficultyStats[];
  weeklyProgress: DailyProgress[];
  monthlyProgress: DailyProgress[];
  learningInsights: LearningInsights;
  achievements: Achievement[];
  recommendations: Recommendation[];
}

export interface StudyTimeStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  avgDailyMinutes: number;
  bestDay: string;
  hourlyPattern: Record<string, number>;
  weekdayPattern: Record<string, StudyStats>;
}

export interface StudyStats {
  minutes: number;
  questions: number;
  accuracy: number;
}

export interface TypePerformance {
  type: string;
  typeLabel: string;
  total: number;
  reviewed: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgTime: number;
  mastered: number;
  improvement: number;
  trend: string;
}

export interface DifficultyStats {
  level: number;
  levelName: string;
  total: number;
  correct: number;
  accuracy: number;
  avgTime: number;
}

export interface DailyProgress {
  date: string;
  questions: number;
  correct: number;
  wrong: number;
  accuracy: number;
  studyMinutes: number;
  newLearned: number;
}

export interface LearningInsights {
  learningVelocity: number;
  consistencyScore: number;
  strengthAreas: string[];
  weakAreas: string[];
  optimalStudyTime: string;
  suggestedFrequency: string;
  predictedMastery: Record<string, any>;
  motivationFactors: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  target: number;
  completed: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
  action: string;
  data?: any;
}

export interface LearningTrends {
  period: string;
  trends: {
    accuracy_trend?: number[];
    study_time_trend?: number[];
    questions_trend?: number[];
    difficulty_trend?: number[];
    streak_trend?: number[];
    weekly_summary?: any[];
    monthly_summary?: any[];
    quarterly_summary?: any[];
    improvement_rate?: number;
    consistency_score?: number;
    quarter_improvement?: number;
    learning_velocity?: number;
    year_improvement?: number;
    total_mastered?: number;
    learning_consistency?: number;
  };
}

export interface PerformanceComparison {
  comparison_type: string;
  data: Record<string, any>;
}

export interface StudyPattern {
  pattern: {
    optimal_study_time: string;
    preferred_session_length: number;
    peak_performance_day: string;
    consistency_score: number;
    learning_style: string;
    focus_patterns: Record<string, number>;
    retention_patterns: Record<string, number>;
  };
}

export interface PersonalizedInsights {
  insights: {
    strengths: string[];
    areas_for_improvement: string[];
    learning_recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
    }>;
    predicted_goals: {
      next_level_estimate: string;
      mastery_projection: Record<string, string>;
    };
    motivation_tips: string[];
  };
}

export interface HeatmapData {
  date: string;
  count: number;
  level: number; // 0-4 intensity level
}

export interface ReviewHeatmap {
  heatmap_data: {
    data: HeatmapData[];
    start_date: string;
    end_date: string;
    max_count: number;
    total_days: number;
  };
  period_days: string;
}

// Create Analytics API
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/analytics`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Analytics', 'Dashboard', 'Trends', 'Achievements'],
  endpoints: (builder) => ({
    // Dashboard Statistics
    getDashboardStats: builder.query<{ stats: DashboardStats }, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard', 'Analytics'],
    }),

    // Learning Trends
    getLearningTrends: builder.query<LearningTrends, { period?: string }>({
      query: ({ period = 'month' } = {}) => ({
        url: '/trends',
        params: { period },
      }),
      providesTags: ['Trends', 'Analytics'],
    }),

    // Review Heatmap
    getReviewHeatmap: builder.query<ReviewHeatmap, { days?: string }>({
      query: ({ days = '365' } = {}) => ({
        url: '/heatmap',
        params: { days },
      }),
      providesTags: ['Analytics'],
    }),

    // Performance Comparison
    getPerformanceComparison: builder.query<PerformanceComparison, { type?: string }>({
      query: ({ type = 'type' } = {}) => ({
        url: '/comparison',
        params: { type },
      }),
      providesTags: ['Analytics'],
    }),

    // Study Pattern Analysis
    getStudyPattern: builder.query<StudyPattern, void>({
      query: () => '/pattern',
      providesTags: ['Analytics'],
    }),

    // Achievement Progress
    getAchievementProgress: builder.query<{ achievements: any }, void>({
      query: () => '/achievements',
      providesTags: ['Achievements', 'Analytics'],
    }),

    // Personalized Insights
    getPersonalizedInsights: builder.query<PersonalizedInsights, void>({
      query: () => '/insights',
      providesTags: ['Analytics'],
    }),

    // Export Analytics Data
    exportAnalyticsData: builder.query<Blob, { format?: string }>({
      query: ({ format = 'json' } = {}) => ({
        url: '/export',
        params: { format },
        responseHandler: 'blob',
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

// Export hooks
export const {
  useGetDashboardStatsQuery,
  useGetLearningTrendsQuery,
  useGetReviewHeatmapQuery,
  useLazyGetReviewHeatmapQuery,
  useGetPerformanceComparisonQuery,
  useGetStudyPatternQuery,
  useGetAchievementProgressQuery,
  useGetPersonalizedInsightsQuery,
  useExportAnalyticsDataQuery,
  useLazyExportAnalyticsDataQuery,
} = analyticsApi;

// Utility functions for analytics
export const analyticsUtils = {
  // Format accuracy percentage
  formatAccuracy: (accuracy: number): string => {
    return `${Math.round(accuracy)}%`;
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

  // Get trend icon
  getTrendIcon: (trend: string): string => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  },

  // Get difficulty color
  getDifficultyColor: (level: number): string => {
    const colors = {
      1: 'text-green-600 bg-green-100',
      2: 'text-blue-600 bg-blue-100',
      3: 'text-yellow-600 bg-yellow-100',
      4: 'text-orange-600 bg-orange-100',
      5: 'text-red-600 bg-red-100',
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  },

  // Get achievement category color
  getAchievementCategoryColor: (category: string): string => {
    const colors = {
      milestone: 'text-purple-600 bg-purple-100',
      daily: 'text-blue-600 bg-blue-100',
      streak: 'text-orange-600 bg-orange-100',
      accuracy: 'text-green-600 bg-green-100',
      mastery: 'text-yellow-600 bg-yellow-100',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  },

  // Calculate progress percentage
  calculateProgressPercentage: (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  },

  // Get recommendation priority color
  getRecommendationPriorityColor: (priority: number): string => {
    if (priority >= 5) return 'border-red-200 bg-red-50';
    if (priority >= 4) return 'border-orange-200 bg-orange-50';
    if (priority >= 3) return 'border-yellow-200 bg-yellow-50';
    if (priority >= 2) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  },

  // Format date for display
  formatDisplayDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  },

  // Get weekday name in Chinese
  getWeekdayName: (weekday: string): string => {
    const names = {
      Sunday: '周日',
      Monday: '周一',
      Tuesday: '周二',
      Wednesday: '周三',
      Thursday: '周四',
      Friday: '周五',
      Saturday: '周六',
    };
    return names[weekday as keyof typeof names] || weekday;
  },

  // Get performance grade
  getPerformanceGrade: (accuracy: number): { grade: string; color: string } => {
    if (accuracy >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-500' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (accuracy >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  },
};