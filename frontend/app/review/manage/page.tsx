"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Target, 
  Calendar, 
  Filter,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Play,
  BarChart3,
  Star,
  Zap,
  TrendingUp,
  Eye,
  PenTool,
  RotateCcw,
  X,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { useGetDueQuestionsQuery, useGetQuestionStatisticsQuery } from "@/lib/store/questionsApi";
import TTSButton from "@/components/ui/TTSButton";

const PRIORITY_LEVELS = {
  high: { label: "高优先级", color: "text-red-600 bg-red-100 border-red-200" },
  medium: { label: "中优先级", color: "text-yellow-600 bg-yellow-100 border-yellow-200" },
  low: { label: "低优先级", color: "text-green-600 bg-green-100 border-green-200" },
};

const QUESTION_TYPES = {
  speaking: { label: "口语", color: "text-pink-600 bg-pink-100" },
  writing: { label: "写作", color: "text-purple-600 bg-purple-100" },
  reading: { label: "阅读", color: "text-blue-600 bg-blue-100" },
  listening: { label: "听力", color: "text-green-600 bg-green-100" },
};

export default function ReviewManagePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  
  const { data: dueQuestionsData, isLoading, error } = useGetDueQuestionsQuery();
  const { data: statsData } = useGetQuestionStatisticsQuery();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">加载复习数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600">请检查网络连接后重试</p>
          </div>
        </div>
      </div>
    );
  }

  const dueQuestions = dueQuestionsData?.due_questions || [];
  const stats = statsData?.statistics;

  // Filter and sort logic
  const filteredQuestions = dueQuestions
    .filter(item => {
      const question = item.question;
      const matchesSearch = !searchTerm || 
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || question.question_type === selectedType;
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      
      return matchesSearch && matchesType && matchesPriority;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'due_date':
          aValue = new Date(a.due_date).getTime();
          bValue = new Date(b.due_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'difficulty':
          aValue = a.question.difficulty_level;
          bValue = b.question.difficulty_level;
          break;
        default:
          aValue = a.question.title;
          bValue = b.question.title;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `逾期 ${Math.abs(diffDays)} 天`;
    } else if (diffDays === 0) {
      return "今天";
    } else if (diffDays === 1) {
      return "明天";
    } else {
      return `${diffDays} 天后`;
    }
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS] || PRIORITY_LEVELS.medium;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  复习管理
                </h1>
                <p className="text-gray-600 mt-1">智能安排，高效复习</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/review/session">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始复习
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">待复习</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.due_today}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">逾期</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">已掌握</p>
                  <p className="text-3xl font-bold text-green-600">{stats.mastered}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">平均准确率</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.round(stats.average_accuracy || 0)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索复习题目..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
              />
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
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
              <span>筛选</span>
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
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              全部类型
            </motion.button>
            {Object.entries(QUESTION_TYPES).map(([type, config]) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedType === type
                    ? `${config.color} shadow-md border border-current`
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {config.label}
              </motion.button>
            ))}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 pt-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">全部优先级</option>
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="due_date">到期时间</option>
                        <option value="priority">优先级</option>
                        <option value="difficulty">难度</option>
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
                        {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">快速筛选</label>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setPriorityFilter("high");
                          setSortBy("due_date");
                          setSortOrder("asc");
                        }}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        高优先级
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSortBy("due_date");
                          setSortOrder("asc");
                        }}
                        className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                      >
                        最早到期
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "没有找到匹配的复习题目" : "暂无待复习题目"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "尝试调整筛选条件" : "所有题目都已完成复习"}
              </p>
              <Link href="/review/session">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始新的复习
                </motion.button>
              </Link>
            </div>
          ) : (
            filteredQuestions.map((item, index) => {
              const question = item.question;
              const priorityConfig = getPriorityConfig(item.priority);
              const typeConfig = QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES];
              
              return (
                <motion.div
                  key={`${question.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </div>

                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeConfig?.color || "text-gray-600 bg-gray-100"}`}>
                          {typeConfig?.label || question.question_type}
                        </div>

                        <div className="flex items-center space-x-1">
                          {getDifficultyStars(question.difficulty_level)}
                        </div>

                        <div className="text-sm text-gray-500">
                          {formatDate(item.due_date)}
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{question.title}</h3>
                        <TTSButton text={question.title} size="sm" className="ml-2" />
                      </div>
                      
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-gray-600 line-clamp-2 flex-1">{question.content}</p>
                        <TTSButton text={question.content} size="sm" className="ml-2 flex-shrink-0" />
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>创建于 {new Date(question.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <RotateCcw className="h-4 w-4" />
                          <span>间隔 {item.interval} 天</span>
                        </div>

                        {question.question_stats && question.question_stats.times_reviewed > 0 && (
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-4 w-4" />
                            <span>已复习 {question.question_stats.times_reviewed} 次</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      {/* Actions dropdown */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setDropdownOpenId(dropdownOpenId === question.id ? null : question.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </motion.button>
                        
                        <AnimatePresence>
                          {dropdownOpenId === question.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                              onMouseLeave={() => setDropdownOpenId(null)}
                            >
                              <Link href={`/review/session?question=${question.id}`}>
                                <button
                                  onClick={() => setDropdownOpenId(null)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Play className="h-4 w-4 mr-3" />
                                  立即复习
                                </button>
                              </Link>
                              
                              <Link href={`/questions/${question.id}`}>
                                <button
                                  onClick={() => setDropdownOpenId(null)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Eye className="h-4 w-4 mr-3" />
                                  查看详情
                                </button>
                              </Link>
                              
                              <Link href={`/questions/edit/${question.id}`}>
                                <button
                                  onClick={() => setDropdownOpenId(null)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <PenTool className="h-4 w-4 mr-3" />
                                  编辑题目
                                </button>
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredQuestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-sm">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-600">待复习题目：{filteredQuestions.length} 道</span>
              </div>
              {filteredQuestions.length !== dueQuestions.length && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500">总计：{dueQuestions.length} 道</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}