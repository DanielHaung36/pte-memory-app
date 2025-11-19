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
  Heart,
  MessageCircle,
  Share,
  ArrowRight,
  AlertCircle,
  CheckCircle,
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
import LearningTrends from "@/components/LearningTrends";
import {
  useGetDueQuestionsQuery,
  useGetOverdueQuestionsQuery,
} from "@/lib/store/questionsApi";
import { useGetPublicFeedQuery, socialUtils } from "@/lib/store/socialApi";
import { useGetDashboardStatsQuery } from "@/lib/store/analyticsApi";
import { useRouter } from "next/navigation";
import SmartReminder from "@/components/SmartReminder";

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
  const { data: overdueQuestionsData } = useGetOverdueQuestionsQuery();
  const { data: socialFeedData } = useGetPublicFeedQuery({
    limit: 3,
    offset: 0,
    type: "all",
  });
  const { data: analyticsData, isLoading: analyticsLoading } =
    useGetDashboardStatsQuery();
  // Calculate stats from real data
  const dueCount = dueQuestionsData?.questions?.length || 0;
  const overdueCount = overdueQuestionsData?.questions?.length || 0;

  // Use real data from analytics API or fallback
  const stats: DashboardStats = analyticsData?.stats
    ? {
        totalQuestions: analyticsData.stats.totalQuestions || 0,
        dueQuestions: dueCount,
        currentStreak: user?.streak || 0,
        todayCompleted: analyticsData.stats.todayReviewed || 0,
        todayGoal: 20,
        accuracyRate: analyticsData.stats.avgAccuracy || 0,
        weeklyAccuracy: analyticsData.stats.weeklyProgress?.map((p: any) => ({
          day: p.date,
          accuracy: p.accuracy
        })) || [],
        categoryPerformance: analyticsData.stats.typePerformance?.map((t: any) => ({
          category: t.typeLabel,
          accuracy: t.accuracy,
          count: t.total
        })) || [],
        recentPerformance: analyticsData.stats.weeklyProgress?.map((p: any) => ({
          date: p.date,
          score: p.accuracy,
          time: p.studyMinutes
        })) || [],
        levelProgress: {
          level: user?.level || 1,
          xp: user?.xp || 0,
          nextLevelXp: ((user?.level || 1) + 1) * 1000, // 1000 XP per level
        },
        achievements: analyticsData.stats.achievements?.map((a: any) => a.name) || [],
      }
    : {
        // Fallback data when analytics API is loading or unavailable
        totalQuestions: 0,
        dueQuestions: dueCount,
        currentStreak: user?.streak || 0,
        todayCompleted: 0,
        todayGoal: 20,
        accuracyRate: 0,
        weeklyAccuracy: [],
        categoryPerformance: [],
        recentPerformance: [],
        levelProgress: {
          level: user?.level || 1,
          xp: user?.xp || 0,
          nextLevelXp: ((user?.level || 1) + 1) * 1000,
        },
        achievements: [],
      };

  // 计算错题复习相关数据 (overdueCount already defined above)
  const totalReviewCount = stats.dueQuestions + overdueCount;

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
      <SmartReminder />
      {/* Header */}
      {/* <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
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
      </div> */}

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

        {/* Due Questions - Enhanced with Ebbinghaus Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              📚 艾宾浩斯复习计划
              {overdueCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {overdueCount} 逾期
                </span>
              )}
            </h3>
            <Link
              href="/review"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 →
            </Link>
          </div>

          {totalReviewCount > 0 ? (
            <div className="space-y-3">
              {/* 逾期题目优先显示 */}
              {overdueQuestionsData?.questions?.slice(0, 3).map((question) => {
                const daysSinceOverdue = Math.floor(
                  (Date.now() -
                    new Date(
                      question.review_schedule?.next_review_date ||
                        question.created_at
                    ).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-3 animate-pulse"></div>
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center">
                          {question.title}
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            逾期 {daysSinceOverdue} 天
                          </span>
                        </h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {question.question_type?.replace("_", " ")} • 第{" "}
                          {(question.review_schedule?.repetition_count || 0) +
                            1}{" "}
                          次复习
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/review/${question.id}`}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      紧急复习
                    </Link>
                  </div>
                );
              })}

              {/* 正常到期题目 */}
              {dueQuestionsData?.questions
                ?.slice(0, overdueCount > 0 ? 2 : 5)
                .map((question) => {
                  const nextReviewDate = new Date(
                    question.review_schedule?.next_review_date ||
                      question.created_at
                  );
                  const today = new Date();
                  const isToday =
                    nextReviewDate.toDateString() === today.toDateString();
                  const easeFactor =
                    question.review_schedule?.ease_factor || 2.5;
                  const repetitionCount =
                    question.review_schedule?.repetition_count || 0;

                  return (
                    <div
                      key={question.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-200 ${
                        isToday
                          ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            isToday
                              ? "bg-blue-500"
                              : question.difficulty_level >= 4
                              ? "bg-red-500"
                              : question.difficulty_level >= 3
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center">
                            {question.title}
                            {isToday && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                今日最佳时机
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {question.question_type?.replace("_", " ")} • 第{" "}
                            {repetitionCount + 1} 次复习 • 掌握度{" "}
                            {Math.round(
                              ((easeFactor - 1.3) / (2.5 - 1.3)) * 100
                            )}
                            %
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/review/${question.id}`}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isToday
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-primary-600 hover:bg-primary-700 text-white"
                        }`}
                      >
                        {isToday ? "最佳复习" : "复习"}
                      </Link>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                🎉 艾宾浩斯复习计划完成
              </h4>
              <p className="text-gray-500 mb-4">
                太棒了！所有错题都已按照遗忘曲线完成复习
              </p>
              <Link href="/questions/create" className="btn-primary">
                添加新题目
              </Link>
            </div>
          )}
        </div>

        {/* Learning Trends - Advanced Component */}
        <div className="mb-8">
          <LearningTrends className="shadow-lg" />
        </div>

        {/* Category Performance Chart */}
        <div className="mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              各科目表现
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "accuracy"
                        ? `${value.toFixed(1)}%`
                        : `${value}题`,
                      name === "accuracy" ? "准确率" : "题目数",
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="accuracy"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Smart Insights Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI学习建议 */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🧠 智能学习建议
              </h3>
              <div className="space-y-3">
                {/* 逾期题目紧急提醒 */}
                {overdueCount > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-red-800">
                          <strong>🚨 紧急：</strong>
                          您有 {overdueCount}{" "}
                          道错题已逾期复习！根据艾宾浩斯遗忘曲线，逾期会大幅降低记忆效果。
                          <Link
                            href="/review"
                            className="text-red-700 underline ml-1 hover:text-red-900"
                          >
                            立即复习 →
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 待复习题目建议 */}
                {stats.dueQuestions > 0 ? (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-purple-800">
                          <strong>艾宾浩斯复习建议：</strong>
                          您有 {stats.dueQuestions} 道题目到期复习。
                          {(() => {
                            const todayDue =
                              dueQuestionsData?.questions?.filter((q) => {
                                const nextReview = new Date(
                                  q.review_schedule?.next_review_date ||
                                    q.created_at
                                );
                                const today = new Date();
                                return (
                                  nextReview.toDateString() ===
                                  today.toDateString()
                                );
                              }).length || 0;

                            if (todayDue > 0) {
                              return `今天有 ${todayDue} 道题到达最佳复习时机，现在复习记忆保持率可达90%以上！`;
                            } else if (stats.dueQuestions >= 20) {
                              return "建议分批进行：难题10-15道，易题10-15道，符合认知负荷理论！";
                            } else if (stats.dueQuestions >= 10) {
                              return "适合一次性完成，预计用时15-20分钟。";
                            } else {
                              return "轻松完成，保持学习节奏！";
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  overdueCount === 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-green-800">
                            <strong>太棒了！</strong>
                            所有题目都已按照艾宾浩斯曲线完成复习。建议添加新题目或进行巩固练习。
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {stats.currentStreak > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Flame className="h-5 w-5 text-orange-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-orange-800">
                          <strong>连击保护：</strong>
                          当前连击 {stats.currentStreak} 次！
                          {stats.currentStreak >= 10
                            ? "您是真正的学习达人！"
                            : "继续保持，连击越高奖励越丰厚！"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800">
                        <strong>最佳时间：</strong>
                        根据学习模式分析，
                        {new Date().getHours() < 12
                          ? "上午是您的黄金学习时段！"
                          : new Date().getHours() < 18
                          ? "下午继续保持专注学习。"
                          : "晚上适合复习巩固知识。"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 学习状态概览 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 学习状态
            </h3>
            <div className="space-y-4">
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user?.level || 1}
                </div>
                <div className="text-sm text-gray-600">当前等级</div>
              </div>

              <div className="text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {user?.xp || 0}
                </div>
                <div className="text-sm text-gray-600">经验值</div>
              </div>

              <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.currentStreak}
                </div>
                <div className="text-sm text-gray-600">连击数</div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>距离下一级</span>
                  <span>
                    {stats.levelProgress.nextLevelXp - stats.levelProgress.xp ||
                      0}
                    XP
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (stats.levelProgress.xp /
                          stats.levelProgress.nextLevelXp) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Feed Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Community Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  社区学习动态
                </h3>
                <Link
                  href="/social"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                >
                  查看更多 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {socialFeedData?.posts && socialFeedData.posts.length > 0 ? (
                  socialFeedData.posts.slice(0, 3).map((postWithStatus) => {
                    const post = postWithStatus.post;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {post.user.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {post.user.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {socialUtils.getPostTypeIcon(post.post_type)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {socialUtils.formatTimeAgo(post.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {post.content}
                            </p>

                            {/* Study Data Summary */}
                            {post.study_data && (
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                <span className="flex items-center">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {post.study_data.questions_completed}题
                                </span>
                                <span className="flex items-center">
                                  <Target className="h-3 w-3 mr-1" />
                                  {Math.round(post.study_data.accuracy)}%
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {socialUtils.formatStudyTime(
                                    post.study_data.time_spent
                                  )}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {post.likes_count}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {post.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">暂无社区动态</p>
                    <Link
                      href="/social"
                      className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                    >
                      去社区看看 →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              快速分享
            </h3>
            <div className="space-y-3">
              <Link
                href="/social"
                className="w-full p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-300 flex items-center space-x-3 group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    分享今日成果
                  </div>
                  <div className="text-xs text-gray-600">
                    让朋友们看到你的进步
                  </div>
                </div>
              </Link>

              <Link
                href="/social"
                className="w-full p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-300 flex items-center space-x-3 group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    分享学习技巧
                  </div>
                  <div className="text-xs text-gray-600">
                    帮助他人，共同进步
                  </div>
                </div>
              </Link>

              {stats.currentStreak >= 5 && (
                <Link
                  href="/social"
                  className="w-full p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-300 flex items-center space-x-3 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      炫耀连击记录
                    </div>
                    <div className="text-xs text-gray-600">
                      当前连击 {stats.currentStreak} 次！
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Review Heatmap */}
        <div className="mb-8">
          <ReviewHeatmap />
        </div>
      </div>
    </div>
  );
}
