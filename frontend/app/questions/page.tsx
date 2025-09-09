"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mic,
  PenTool,
  Eye,
  Headphones,
  Star,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useGetQuestionsQuery, useGetQuestionStatisticsQuery } from "@/lib/store/questionsApi";
import { useWebSocket } from "@/lib/websocket/client";
import TTSButton from "@/components/ui/TTSButton";
import QuestionDetailModal from "@/components/ui/QuestionDetailModal";

const QUESTION_TYPES = {
  speaking: { label: "口语", icon: <Mic className="h-4 w-4" />, color: "text-pink-600 bg-pink-100" },
  writing: { label: "写作", icon: <PenTool className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
  reading: { label: "阅读", icon: <Eye className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
  listening: { label: "听力", icon: <Headphones className="h-4 w-4" />, color: "text-green-600 bg-green-100" },
};

export default function QuestionsPage() {
  const { isConnected } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const { 
    data: questionsData, 
    isLoading: questionsLoading, 
    error: questionsError 
  } = useGetQuestionsQuery({ 
    type: selectedType === "all" ? undefined : selectedType,
    limit: 50 
  });

  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetQuestionStatisticsQuery();

  // 重置页码当筛选条件改变时 - 必须在条件返回之前
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, difficultyFilter, sortBy, sortOrder]);

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600">请检查网络连接后重试</p>
        </div>
      </div>
    );
  }

  const questions = questionsData?.questions || [];
  const stats = statsData?.statistics;

  // 过滤和排序逻辑
  const filteredQuestions = questions
    .filter(question => {
      const matchesSearch = !searchTerm || 
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || question.question_type === selectedType;
      const matchesDifficulty = difficultyFilter === "all" || 
        question.difficulty_level.toString() === difficultyFilter;
      
      return matchesSearch && matchesType && matchesDifficulty;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'difficulty':
          aValue = a.difficulty_level;
          bValue = b.difficulty_level;
          break;
        case 'accuracy':
          aValue = a.question_stats?.accuracy_rate || 0;
          bValue = b.question_stats?.accuracy_rate || 0;
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 分页逻辑
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / pageSize);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600 bg-green-100";
    if (accuracy >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-6 h-6 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-30 blur-sm"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute top-40 right-20 w-4 h-4 bg-gradient-to-br from-blue-300 to-teal-300 rounded-full opacity-25 blur-sm"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
          className="absolute bottom-32 left-1/4 w-8 h-8 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-20 blur-sm"
        />
      </div>

      {/* Navigation */}
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  错题管理
                </h1>
                <p className="text-gray-600 mt-1">智能复习，高效学习</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? '实时同步' : '离线模式'}
                </span>
              </div>

              <Link href="/questions/simple">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  添加错题
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-blue-200/50 cursor-pointer group overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.p 
                    className="text-sm text-gray-600 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    总错题数
                  </motion.p>
                  <motion.p 
                    className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                  >
                    {stats.total_questions}
                  </motion.p>
                </div>
                <motion.div 
                  className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl group-hover:from-blue-200 group-hover:to-purple-200 transition-all"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </motion.div>
                
                {/* 装饰性光效 */}
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-orange-200/50 cursor-pointer group overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.p 
                    className="text-sm text-gray-600 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    待复习
                  </motion.p>
                  <motion.p 
                    className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                  >
                    {stats.due_questions}
                  </motion.p>
                </div>
                <motion.div 
                  className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl group-hover:from-orange-200 group-hover:to-red-200 transition-all"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                  animate={{ rotate: [0, 2, 0, -2, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Clock className="h-6 w-6 text-orange-600" />
                </motion.div>
                
                {/* 装饰性光效 */}
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已掌握</p>
                  <p className="text-2xl font-bold text-green-600">{stats.mastered_questions}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均准确率</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.average_accuracy || 0)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8"
        >
          {/* Top Row - Search and Advanced Filters Toggle */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索错题标题或内容..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 backdrop-blur-sm transition-all"
              />
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                showAdvancedFilters
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>高级筛选</span>
            </motion.button>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedType === "all"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
              }`}
            >
              全部类型
            </motion.button>
            {Object.entries(QUESTION_TYPES).map(([type, config]) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(type)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                  selectedType === type
                    ? `${config.color} shadow-md border-2 border-white`
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                }`}
              >
                <motion.div
                  animate={selectedType === type ? { rotate: [0, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {config.icon}
                </motion.div>
                <span>{config.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-t border-gray-200 pt-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Difficulty Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>难度等级</span>
                    </label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 backdrop-blur-sm"
                    >
                      <option value="all">全部难度</option>
                      <option value="1">⭐ 初级</option>
                      <option value="2">⭐⭐ 简单</option>
                      <option value="3">⭐⭐⭐ 中等</option>
                      <option value="4">⭐⭐⭐⭐ 困难</option>
                      <option value="5">⭐⭐⭐⭐⭐ 极难</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span>排序方式</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 backdrop-blur-sm"
                      >
                        <option value="created_at">创建时间</option>
                        <option value="difficulty">难度等级</option>
                        <option value="accuracy">准确率</option>
                        <option value="title">标题</option>
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className={`px-3 py-2 rounded-xl border transition-all ${
                          sortOrder === "desc"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "desc" ? "↓" : "↑"}
                      </motion.button>
                    </div>
                  </div>

                  {/* Page Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>每页显示</span>
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 backdrop-blur-sm"
                    >
                      <option value={5}>5 条</option>
                      <option value={10}>10 条</option>
                      <option value={20}>20 条</option>
                      <option value={50}>50 条</option>
                    </select>
                  </div>
                </div>

                {/* Quick Filter Actions */}
                <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">快速筛选：</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setDifficultyFilter("4");
                      setSortBy("created_at");
                      setSortOrder("desc");
                    }}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    困难题目
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSortBy("accuracy");
                      setSortOrder("asc");
                      setDifficultyFilter("all");
                    }}
                    className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                  >
                    低准确率
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedType("all");
                      setDifficultyFilter("all");
                      setSortBy("created_at");
                      setSortOrder("desc");
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    重置筛选
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-6">
          {paginatedQuestions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "没有找到匹配的错题" : "还没有错题"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "尝试使用不同的搜索词" : "开始添加你的第一个错题吧"}
              </p>
              <Link href="/questions/simple">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  添加错题
                </motion.button>
              </Link>
            </div>
          ) : (
            paginatedQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.color || "text-gray-600 bg-gray-100"
                      }`}>
                        {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.icon}
                        <span className="ml-1">
                          {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.label || question.question_type}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {getDifficultyStars(question.difficulty_level)}
                      </div>

                      {question.question_stats && question.question_stats.accuracy_rate > 0 && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getAccuracyColor(question.question_stats.accuracy_rate)
                        }`}>
                          {Math.round(question.question_stats.accuracy_rate)}% 准确率
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">{question.title}</h3>
                      <TTSButton text={question.title} size="sm" className="ml-2" />
                    </div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-gray-600 line-clamp-2 flex-1">{question.content}</p>
                      <TTSButton text={question.content} size="sm" className="ml-2 flex-shrink-0" />
                    </div>

                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {question.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>创建于 {formatDate(question.created_at)}</span>
                      </div>

                      {question.review_schedule && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>下次复习 {formatDate(question.review_schedule.next_review_date)}</span>
                        </div>
                      )}

                      {question.question_stats && question.question_stats.times_reviewed > 0 && (
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>已复习 {question.question_stats.times_reviewed} 次</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {question.review_schedule?.is_mastered && (
                      <div className="text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}

                    {/* 三点菜单 */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setDropdownOpenId(dropdownOpenId === question.id ? null : question.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="更多操作"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </motion.button>
                      
                      {/* 下拉菜单 */}
                      <AnimatePresence>
                        {dropdownOpenId === question.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                            onMouseLeave={() => setDropdownOpenId(null)}
                          >
                            <button
                              onClick={() => {
                                setSelectedQuestion(question);
                                setIsDetailModalOpen(true);
                                setDropdownOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-3" />
                              查看详情
                            </button>
                            
                            <button
                              onClick={() => {
                                console.log('编辑题目:', question.id);
                                setDropdownOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <PenTool className="h-4 w-4 mr-3" />
                              编辑题目
                            </button>
                            
                            <button
                              onClick={() => {
                                console.log('开始复习:', question.id);
                                setDropdownOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Target className="h-4 w-4 mr-3" />
                              开始复习
                            </button>
                            
                            <button
                              onClick={() => {
                                if (question.review_schedule?.is_mastered) {
                                  console.log('标记为未掌握:', question.id);
                                } else {
                                  console.log('标记为已掌握:', question.id);
                                }
                                setDropdownOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              {question.review_schedule?.is_mastered ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-3" />
                                  标记为未掌握
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-3" />
                                  标记为已掌握
                                </>
                              )}
                            </button>
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            <button
                              onClick={() => {
                                if (confirm('确定要删除这道题目吗？')) {
                                  console.log('删除题目:', question.id);
                                }
                                setDropdownOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <X className="h-4 w-4 mr-3" />
                              删除题目
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalQuestions > 0 && totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mt-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              {/* Info */}
              <div className="text-sm text-gray-600">
                显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalQuestions)} 条，
                共 {totalQuestions} 个错题 ({totalPages} 页)
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                {/* First Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronsLeft className="h-5 w-5" />
                </motion.button>
                
                {/* Previous Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </motion.button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-110'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
                
                {/* Last Page */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronsRight className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Quick Jump */}
            <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">跳转到：</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-500">/ {totalPages}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Summary */}
        {totalQuestions > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-sm">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600">当前筛选结果：{totalQuestions} 个错题</span>
              </div>
              {totalQuestions !== questions.length && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500">总计：{questions.length} 个错题</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Question Detail Modal */}
      <QuestionDetailModal 
        question={selectedQuestion}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedQuestion(null);
        }}
      />
    </div>
  );
}