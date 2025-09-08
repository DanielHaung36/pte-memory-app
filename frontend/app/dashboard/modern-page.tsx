"use client";

import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useState, useEffect } from "react";
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
  PieChart,
  LineChart,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import axios from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import KnowledgeGraphVisualization from "@/components/KnowledgeGraphVisualization";
import AILearningAssistant from "@/components/AILearningAssistant";
import { AIServices } from "@/lib/ai-services";

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

export default function ModernDashboardPage() {
  const { user } = useReduxAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 156,
    dueQuestions: 12,
    currentStreak: 7,
    todayCompleted: 8,
    todayGoal: 20,
    accuracyRate: 78.5,
    weeklyAccuracy: [
      { day: "Mon", accuracy: 76 },
      { day: "Tue", accuracy: 82 },
      { day: "Wed", accuracy: 75 },
      { day: "Thu", accuracy: 80 },
      { day: "Fri", accuracy: 85 },
      { day: "Sat", accuracy: 79 },
      { day: "Sun", accuracy: 83 },
    ],
    categoryPerformance: [
      { category: "Listening", accuracy: 75, count: 45 },
      { category: "Speaking", accuracy: 82, count: 38 },
      { category: "Reading", accuracy: 68, count: 52 },
      { category: "Writing", accuracy: 79, count: 21 },
    ],
    recentPerformance: [],
    levelProgress: { level: 3, xp: 235, nextLevelXp: 400 },
    achievements: [
      "first_question",
      "week_streak",
      "accuracy_master",
      "fast_learner",
    ],
  });

  const [dueQuestions, setDueQuestions] = useState<DueQuestion[]>([
    {
      id: "1",
      title: "PTE Listening - Fill in the blanks",
      questionType: "listening",
      nextReviewDate: "2025-09-07",
      priority: 4,
    },
    {
      id: "2",
      title: "IELTS Writing Task 1 - Graph Description",
      questionType: "writing",
      nextReviewDate: "2025-09-07",
      priority: 3,
    },
    {
      id: "3",
      title: "PTE Speaking - Read Aloud",
      questionType: "speaking",
      nextReviewDate: "2025-09-07",
      priority: 5,
    },
  ]);

  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData>({
    nodes: [
      {
        id: "1",
        name: "Basic Grammar",
        node_type: "skill",
        category: "grammar",
        level: 1,
      },
      {
        id: "2",
        name: "Listening Skills",
        node_type: "skill",
        category: "listening",
        level: 2,
      },
      {
        id: "3",
        name: "Speaking Fluency",
        node_type: "skill",
        category: "speaking",
        level: 3,
      },
    ],
    edges: [
      {
        id: "1",
        from_node_id: "1",
        to_node_id: "2",
        edge_type: "prerequisite",
        weight: 0.8,
      },
    ],
  });

  const [userProgress, setUserProgress] = useState<UserProgress[]>([
    {
      node_id: "1",
      mastery_level: 0.85,
      study_count: 15,
      last_studied: "2025-09-06",
    },
    {
      node_id: "2",
      mastery_level: 0.65,
      study_count: 8,
      last_studied: "2025-09-05",
    },
    {
      node_id: "3",
      mastery_level: 0.45,
      study_count: 5,
      last_studied: "2025-09-04",
    },
  ]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "knowledge" | "ai"
  >("overview");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // In a real implementation, this would fetch from API
    setLoading(false);
  };

  const getProgressPercentage = () => {
    return Math.min((stats.todayCompleted / stats.todayGoal) * 100, 100);
  };

  const getLevelProgress = () => {
    return (stats.levelProgress.xp / stats.levelProgress.nextLevelXp) * 100;
  };

  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"];

  const tabs = [
    { id: "overview", label: "总览", icon: BarChart3 },
    { id: "analytics", label: "数据分析", icon: TrendingUp },
    { id: "knowledge", label: "知识图谱", icon: Brain },
    { id: "ai", label: "AI助手", icon: Lightbulb },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="h-12 w-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center space-x-3"
              >
                <Brain className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PTE智能学习系统
                </h1>
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  href="/questions/add"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加题目
                </Link>
              </motion.div>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.username || "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Level {stats.levelProgress.level}
                  </div>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {(user?.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Level Progress */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  欢迎回来，{user?.username || "User"}！ 👋
                </h2>
                <p className="text-gray-600 text-lg">
                  今天是学习的好日子，让我们继续进步吧！
                </p>
              </div>

              {/* Level Progress */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl text-white min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Level {stats.levelProgress.level}
                  </span>
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
                <div className="text-xs text-center">
                  {stats.levelProgress.xp} / {stats.levelProgress.nextLevelXp}{" "}
                  XP
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
            <nav className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "总题目数",
                      value: stats.totalQuestions,
                      icon: BookOpen,
                      color: "blue",
                      trend: "+12%",
                    },
                    {
                      title: "待复习",
                      value: stats.dueQuestions,
                      icon: Clock,
                      color: "orange",
                      trend: "-5%",
                    },
                    {
                      title: "连续学习",
                      value: `${stats.currentStreak}天`,
                      icon: Flame,
                      color: "red",
                      trend: "+2天",
                    },
                    {
                      title: "准确率",
                      value: `${stats.accuracyRate.toFixed(1)}%`,
                      icon: Target,
                      color: "green",
                      trend: "+3.2%",
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                          <stat.icon
                            className={`h-6 w-6 text-${stat.color}-600`}
                          />
                        </div>
                        <div
                          className={`text-xs font-medium text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded-full`}
                        >
                          {stat.trend}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.title}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Today's Progress & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Target className="h-6 w-6 mr-3 text-blue-600" />
                        今日学习目标
                      </h3>

                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>
                            已完成 {stats.todayCompleted} / {stats.todayGoal} 题
                          </span>
                          <span className="font-semibold">
                            {getProgressPercentage().toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>

                      {stats.todayCompleted >= stats.todayGoal ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center">
                            <Trophy className="h-6 w-6 text-green-600 mr-3" />
                            <p className="text-green-800 font-medium">
                              🎉 太棒了！今日目标已完成！
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center">
                            <Activity className="h-6 w-6 text-blue-600 mr-3" />
                            <p className="text-blue-800">
                              再完成{" "}
                              <span className="font-bold">
                                {stats.todayGoal - stats.todayCompleted}
                              </span>{" "}
                              题就能达成目标！
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Zap className="h-6 w-6 mr-3 text-purple-600" />
                      快速开始
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          href: "/review",
                          label: "开始复习",
                          icon: Play,
                          color: "blue",
                          count: stats.dueQuestions,
                        },
                        {
                          href: "/games",
                          label: "趣味游戏",
                          icon: Trophy,
                          color: "purple",
                          count: null,
                        },
                        {
                          href: "/questions",
                          label: "题目管理",
                          icon: BookMarked,
                          color: "green",
                          count: stats.totalQuestions,
                        },
                      ].map((action) => (
                        <motion.div
                          key={action.href}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Link
                            href={action.href}
                            className={`flex items-center justify-between p-4 bg-gradient-to-r from-${action.color}-50 to-${action.color}-100 hover:from-${action.color}-100 hover:to-${action.color}-200 rounded-xl transition-all duration-200 group`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`p-2 bg-${action.color}-500 rounded-lg mr-3 group-hover:scale-110 transition-transform`}
                              >
                                <action.icon className="h-4 w-4 text-white" />
                              </div>
                              <span
                                className={`font-medium text-${action.color}-700`}
                              >
                                {action.label}
                              </span>
                            </div>
                            {action.count && (
                              <div
                                className={`bg-${action.color}-500 text-white text-xs font-bold px-2 py-1 rounded-full`}
                              >
                                {action.count}
                              </div>
                            )}
                            <ChevronRight
                              className={`h-4 w-4 text-${action.color}-600 group-hover:translate-x-1 transition-transform`}
                            />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Due Questions */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Clock className="h-6 w-6 mr-3 text-orange-600" />
                      待复习题目
                    </h3>
                    <Link
                      href="/review"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      查看全部 <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>

                  {dueQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {dueQuestions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-white hover:to-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full mr-4 ${
                                question.priority >= 4
                                  ? "bg-red-500"
                                  : question.priority >= 3
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {question.title}
                              </h4>
                              <p className="text-sm text-gray-500 capitalize">
                                {question.questionType.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link
                              href={`/review/${question.id}`}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                            >
                              复习
                            </Link>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      </motion.div>
                      <h4 className="text-lg font-medium text-gray-600 mb-2">
                        太棒了！
                      </h4>
                      <p className="text-gray-500 mb-6">
                        您已经完成了所有计划的复习内容
                      </p>
                      <Link
                        href="/questions/add"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 inline-flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加新题目
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Weekly Accuracy Trend */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                      本周准确率趋势
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={stats.weeklyAccuracy}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" stroke="#666" />
                        <YAxis stroke="#666" domain={[50, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="url(#colorGradient)"
                          strokeWidth={3}
                          dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, fill: "#3B82F6" }}
                        />
                        <defs>
                          <linearGradient
                            id="colorGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Performance */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <PieChart className="h-6 w-6 mr-3 text-purple-600" />
                      各类型表现分布
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={stats.categoryPerformance}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="accuracy"
                          nameKey="category"
                        >
                          {stats.categoryPerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Details */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-3 text-green-600" />
                    分类详细表现
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.categoryPerformance.map((category, index) => (
                      <motion.div
                        key={category.category}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-center p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200"
                      >
                        <div
                          className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        >
                          {category.accuracy}%
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {category.category}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {category.count} 题练习
                        </p>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${category.accuracy}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "knowledge" && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Brain className="h-6 w-6 mr-3 text-blue-600" />
                  知识图谱可视化
                </h3>
                <KnowledgeGraphVisualization
                  nodes={knowledgeGraph.nodes}
                  edges={knowledgeGraph.edges}
                  userProgress={userProgress}
                  height={600}
                />
              </div>
            )}

            {activeTab === "ai" && (
              <AILearningAssistant
                userStats={{
                  overall_accuracy: stats.accuracyRate / 100,
                  study_streak: stats.currentStreak,
                  total_questions: stats.totalQuestions,
                }}
                userProgress={userProgress}
                knowledgeNodes={knowledgeGraph.nodes}
                recentPerformance={stats.recentPerformance}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
