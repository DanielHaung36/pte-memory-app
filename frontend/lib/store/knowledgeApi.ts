// DEPRECATED: 知识图谱功能已移除
// 此文件仅保留用于参考，不再使用

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BACKEND_URL;

// Knowledge Graph API types
export interface KnowledgeNode {
  id: string;
  name: string;
  description: string;
  node_type: 'concept' | 'skill' | 'foundation' | 'knowledge';
  level: number;
  category: string;
  mastery_level: number;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: 'prerequisite' | 'enables' | 'related' | 'part_of';
  weight: number;
  created_at?: string;
}

export interface UserKnowledgeProgress {
  id: string;
  user_id: string;
  node_id: string;
  mastery_level: number;
  study_count: number;
  last_studied: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  name: string;
  description: string;
  node_sequence: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface UserProgressResponse {
  progress: UserKnowledgeProgress[];
}

export interface RecommendedQuestion {
  question_id: string;
  node_id: string;
  relevance_score: number;
  difficulty_match: number;
  explanation: string;
}

export interface KnowledgeInsight {
  type: 'strength' | 'weakness' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  related_nodes: string[];
}

// Create Knowledge API
export const knowledgeApi = createApi({
  reducerPath: 'knowledgeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/knowledge`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['KnowledgeGraph', 'UserProgress', 'LearningPath', 'Recommendations'],
  endpoints: (builder) => ({
    // Get knowledge graph
    getKnowledgeGraph: builder.query<KnowledgeGraphResponse, void>({
      query: () => '/graph',
      providesTags: ['KnowledgeGraph'],
    }),

    // Get user knowledge progress
    getUserKnowledgeProgress: builder.query<UserProgressResponse, void>({
      query: () => '/progress',
      providesTags: ['UserProgress'],
    }),

    // Update user knowledge progress
    updateUserKnowledgeProgress: builder.mutation<
      { message: string },
      { nodeId: string; masteryLevel: number }
    >({
      query: ({ nodeId, masteryLevel }) => ({
        url: `/progress/${nodeId}`,
        method: 'PUT',
        body: { mastery_level: masteryLevel },
      }),
      invalidatesTags: ['UserProgress'],
    }),

    // Get learning paths
    getLearningPath: builder.query<{ paths: LearningPath[] }, void>({
      query: () => '/learning-path',
      providesTags: ['LearningPath'],
    }),

    // Generate learning path
    generateLearningPath: builder.mutation<
      { message: string; path: LearningPath },
      { targetNodes: string[]; difficulty?: string }
    >({
      query: (data) => ({
        url: '/learning-path/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LearningPath'],
    }),

    // Get recommended questions
    getRecommendedQuestions: builder.query<
      { recommendations: RecommendedQuestion[] },
      { limit?: number; nodeId?: string }
    >({
      query: ({ limit = 10, nodeId } = {}) => ({
        url: '/recommendations',
        params: { limit, node_id: nodeId },
      }),
      providesTags: ['Recommendations'],
    }),

    // Analyze question knowledge
    analyzeQuestionKnowledge: builder.mutation<
      { analysis: any },
      { questionId: string }
    >({
      query: ({ questionId }) => ({
        url: '/analyze',
        method: 'POST',
        body: { question_id: questionId },
      }),
    }),

    // Get knowledge insights
    getKnowledgeInsights: builder.query<
      { insights: KnowledgeInsight[] },
      { limit?: number }
    >({
      query: ({ limit = 5 } = {}) => ({
        url: '/insights',
        params: { limit },
      }),
    }),

    // Get similar questions
    getSimilarQuestions: builder.query<
      { questions: any[] },
      { questionId: string; limit?: number }
    >({
      query: ({ questionId, limit = 5 }) => ({
        url: `/similar/${questionId}`,
        params: { limit },
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetKnowledgeGraphQuery,
  useGetUserKnowledgeProgressQuery,
  useUpdateUserKnowledgeProgressMutation,
  useGetLearningPathQuery,
  useGenerateLearningPathMutation,
  useGetRecommendedQuestionsQuery,
  useAnalyzeQuestionKnowledgeMutation,
  useGetKnowledgeInsightsQuery,
  useGetSimilarQuestionsQuery,
} = knowledgeApi;

// Utility functions for knowledge graph
export const knowledgeUtils = {
  // Get node type display name
  getNodeTypeText: (type: string): string => {
    const typeMap = {
      concept: '概念',
      skill: '技能',
      foundation: '基础',
      knowledge: '知识点',
    };
    return typeMap[type as keyof typeof typeMap] || '未知';
  },

  // Get node type icon
  getNodeTypeIcon: (type: string): string => {
    const iconMap = {
      concept: '🧠',
      skill: '⚡',
      foundation: '🏗️',
      knowledge: '📚',
    };
    return iconMap[type as keyof typeof iconMap] || '❓';
  },

  // Get mastery level color
  getMasteryColor: (level: number): string => {
    if (level >= 0.8) return 'text-green-600 bg-green-100';
    if (level >= 0.6) return 'text-blue-600 bg-blue-100';
    if (level >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  },

  // Get mastery level text
  getMasteryText: (level: number): string => {
    if (level >= 0.9) return '精通';
    if (level >= 0.7) return '熟练';
    if (level >= 0.5) return '掌握';
    if (level >= 0.3) return '学习中';
    return '待学习';
  },

  // Calculate overall progress
  calculateOverallProgress: (progress: UserKnowledgeProgress[]): number => {
    if (progress.length === 0) return 0;
    const total = progress.reduce((sum, p) => sum + p.mastery_level, 0);
    return total / progress.length;
  },

  // Get edge type display text
  getEdgeTypeText: (type: string): string => {
    const typeMap = {
      prerequisite: '前置条件',
      enables: '解锁',
      related: '相关',
      part_of: '组成部分',
    };
    return typeMap[type as keyof typeof typeMap] || '关联';
  },

  // Filter nodes by category
  filterNodesByCategory: (nodes: KnowledgeNode[], category: string): KnowledgeNode[] => {
    if (category === 'all') return nodes;
    return nodes.filter(node => node.category === category);
  },

  // Get weakest nodes for recommendations
  getWeakestNodes: (progress: UserKnowledgeProgress[], limit: number = 5): UserKnowledgeProgress[] => {
    return [...progress]
      .sort((a, b) => a.mastery_level - b.mastery_level)
      .slice(0, limit);
  },

  // Get categories from nodes
  getCategories: (nodes: KnowledgeNode[]): string[] => {
    const categories = new Set(nodes.map(node => node.category));
    return Array.from(categories).sort();
  },

  // Format study time
  formatLastStudied: (lastStudied: string): string => {
    const date = new Date(lastStudied);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return '今天';
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 7) return `${diffInDays}天前`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`;
    return `${Math.floor(diffInDays / 30)}个月前`;
  },
};