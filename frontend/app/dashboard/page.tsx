"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import {
  Brain,
  BookOpen,
  Clock,
  Zap,
  TrendingUp,
  Play,
  Plus,
  Target,
  BarChart3,
  Award,
  Globe,
  Users,
  ChevronRight,
  Activity,
  Calendar,
  Flame,
  Trophy,
  BookMarked,
  Lightbulb,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import KnowledgeGraphVisualization from "@/components/KnowledgeGraphVisualization";
import AILearningAssistant from "@/components/AILearningAssistant";
import ReviewHeatmap from "@/components/ReviewHeatmap";
import DailyGoal from "@/components/DailyGoal";
import { useGetDueQuestionsQuery } from "@/lib/store/questionsApi";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalQuestions: number;
  dueQuestions: number;
  currentStreak: number;
  todayCompleted: number;
  todayGoal: number;
  accuracyRate: number;
  weeklyAccuracy: { day: string; accuracy: number }[];
  categoryPerformance: { category: string; accuracy: number; count: number }[];
  recentPerformance: { date: string; score: number; time: number }[];
  levelProgress: { level: number; xp: number; nextLevelXp: number };
  achievements: string[];
}

interface DueQuestion {
  id: string;
  title: string;
  questionType: string;
  nextReviewDate: string;
  priority: number;
}

interface KnowledgeGraphData {
  nodes: any[];
  edges: any[];
}

interface UserProgress {
  node_id: string;
  mastery_level: number;
  study_count: number;
  last_studied: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "knowledge" | "ai"
  >("overview");

  // 使用RTK Query获取数据
  const { data: dueQuestionsData, isLoading } = useGetDueQuestionsQuery({
    limit: 5,
  });
  // Mock data generation functions
  const generateMockWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      accuracy: Math.random() * 30 + 60, // 60-90% accuracy
    }));
  };
  const generateMockCategoryData = () => [
    { category: "Listening", accuracy: 75, count: 15 },
    { category: "Speaking", accuracy: 82, count: 12 },
    { category: "Reading", accuracy: 68, count: 20 },
    { category: "Writing", accuracy: 79, count: 10 },
  ];

  const generateMockPerformanceData = () => {
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        score: Math.random() * 30 + 60,
        time: Math.random() * 60 + 30,
      });
    }
    return data;
  };

  // Mock数据，实际应该从API获取
  const stats: DashboardStats = {
    totalQuestions: 0,
    dueQuestions: dueQuestionsData?.questions?.length || 0,
    currentStreak: user?.streak_count || 0,
    todayCompleted: 0,
    todayGoal: 20,
    accuracyRate: 0,
    weeklyAccuracy: generateMockWeeklyData(),
    categoryPerformance: generateMockCategoryData(),
    recentPerformance: generateMockPerformanceData(),
    levelProgress: {
      level: user?.level || 1,
      xp: user?.xp || 0,
      nextLevelXp: ((user?.level || 1) + 1) * 100,
    },
    achievements: ["first_question", "three_day_streak", "accuracy_master"],
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 20) return "text-red-600 bg-red-100";
    if (streak >= 10) return "text-purple-600 bg-purple-100";
    if (streak >= 5) return "text-green-600 bg-green-100";
    if (streak >= 3) return "text-blue-600 bg-blue-100";
    return "text-gray-600 bg-gray-100";
  };

  const getProgressPercentage = () => {
    if (stats.todayGoal === 0) return 0;
    return Math.min((stats.todayCompleted / stats.todayGoal) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">PTE记忆助手</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/questions/create"
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加错题
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    Level {user?.level || 1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{user?.username}！
          </h2>
          <p className="text-gray-600">
            继续您的学习之旅，今天也要保持学习的热情哦！
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总题目数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalQuestions}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待复习</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.dueQuestions}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">连击数</p>
                <p
                  className={`text-2xl font-bold ${
                    getStreakColor(stats.currentStreak).split(" ")[0]
                  }`}
                >
                  {stats.currentStreak}
                </p>
              </div>
              <div
                className={`p-2 rounded-lg ${getStreakColor(
                  stats.currentStreak
                )}`}
              >
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">正确率</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.accuracyRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Today's Progress - New DailyGoal Component */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DailyGoal
              onStartReview={() => router.push("/review")}
              className="h-full"
            />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              快速开始
            </h3>
            <div className="space-y-3">
              <Link
                href="/review"
                className="flex items-center justify-between p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
              >
                <span className="font-medium text-primary-700">开始复习</span>
                <Play className="h-4 w-4 text-primary-600" />
              </Link>
              <Link
                href="/games"
                className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
              >
                <span className="font-medium text-purple-700">趣味游戏</span>
                <Play className="h-4 w-4 text-purple-600" />
              </Link>
              <Link
                href="/questions"
                className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
              >
                <span className="font-medium text-green-700">题目管理</span>
                <BookOpen className="h-4 w-4 text-green-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Due Questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">待复习题目</h3>
            <Link
              href="/review"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 →
            </Link>
          </div>

          {stats.dueQuestions.length > 0 ? (
            <div className="space-y-3">
              {stats.dueQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        question.priority >= 4
                          ? "bg-red-500"
                          : question.priority >= 3
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {question.title}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {question.questionType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/review/${question.id}`}
                    className="btn-primary text-sm"
                  >
                    复习
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                暂无待复习题目
              </h4>
              <p className="text-gray-500 mb-4">
                太棒了！您已经完成了所有计划的复习内容
              </p>
              <Link href="/questions/create" className="btn-primary">
                添加新题目
              </Link>
            </div>
          )}
        </div>

        {/* Review Heatmap */}
        <div className="mb-8">
          <ReviewHeatmap
            onDateClick={(date, data) => {
              console.log(`Clicked on ${date}:`, data);
            }}
            showStats={true}
          />
        </div>
      </div>
    </div>
  );
}
