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
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Brain,
  ChevronUp,
  ChevronDown,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  useGetWrongQuestionsQuery,
  useGetWrongQuestionStatsQuery,
  useDeleteWrongQuestionMutation,
  useUpdateWrongQuestionMutation,
  useBatchUpdateWrongQuestionsMutation,
} from "@/lib/store/wrongQuestionsApi";
import { useWebSocket } from "@/lib/websocket/client";
import TTSButton from "@/components/ui/TTSButton";
import WrongQuestionModal from "@/components/ui/WrongQuestionModal";
import { useConfirm } from "@/hooks/useConfirm";

const ERROR_TYPES = {
  understanding: {
    label: "理解错误",
    icon: <Brain className="h-4 w-4" />,
    color: "text-red-600 bg-red-100",
  },
  carelessness: {
    label: "粗心大意",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-orange-600 bg-orange-100",
  },
  knowledge_gap: {
    label: "知识盲区",
    icon: <Eye className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-100",
  },
  time_pressure: {
    label: "时间压力",
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-100",
  },
  grammar: {
    label: "语法错误",
    icon: <PenTool className="h-4 w-4" />,
    color: "text-indigo-600 bg-indigo-100",
  },
  vocabulary: {
    label: "词汇错误",
    icon: <Brain className="h-4 w-4" />,
    color: "text-pink-600 bg-pink-100",
  },
  comprehension: {
    label: "理解错误",
    icon: <Eye className="h-4 w-4" />,
    color: "text-green-600 bg-green-100",
  },
  pronunciation: {
    label: "发音错误",
    icon: <Mic className="h-4 w-4" />,
    color: "text-yellow-600 bg-yellow-100",
  },
};

const QUESTION_TYPES = {
  speaking: {
    label: "口语",
    icon: <Mic className="h-4 w-4" />,
    color: "text-pink-600 bg-pink-100",
  },
  writing: {
    label: "写作",
    icon: <PenTool className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-100",
  },
  reading: {
    label: "阅读",
    icon: <Eye className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-100",
  },
  listening: {
    label: "听力",
    icon: <Headphones className="h-4 w-4" />,
    color: "text-green-600 bg-green-100",
  },
};

export default function WrongQuestionsPage() {
  const { isConnected } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedErrorType, setSelectedErrorType] = useState<string>("all");
  const [selectedResolutionStatus, setSelectedResolutionStatus] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("last_wrong_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedWrongQuestion, setSelectedWrongQuestion] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  const {
    data: wrongQuestionsData,
    isLoading: wrongQuestionsLoading,
    error: wrongQuestionsError,
  } = useGetWrongQuestionsQuery({
    limit: 50,
    error_type: selectedErrorType === "all" ? undefined : selectedErrorType,
    is_resolved:
      selectedResolutionStatus === "all"
        ? undefined
        : selectedResolutionStatus === "resolved",
  });

  const { data: statsData, isLoading: statsLoading } =
    useGetWrongQuestionStatsQuery();

  const [deleteWrongQuestion] = useDeleteWrongQuestionMutation();
  const [updateWrongQuestion] = useUpdateWrongQuestionMutation();
  const [batchUpdate] = useBatchUpdateWrongQuestionsMutation();
  const { confirm, ConfirmationDialog } = useConfirm();

  // 重置页码当筛选条件改变时
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedErrorType,
    selectedResolutionStatus,
    sortBy,
    sortOrder,
  ]);

  if (wrongQuestionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">加载错题中...</p>
        </div>
      </div>
    );
  }

  if (wrongQuestionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600">请检查网络连接后重试</p>
        </div>
      </div>
    );
  }

  const wrongQuestions = wrongQuestionsData?.wrong_questions || [];
  const stats = statsData?.stats;

  // 过滤和排序逻辑
  const filteredQuestions = wrongQuestions
    .filter((question) => {
      const matchesSearch =
        !searchTerm ||
        question.error_reason
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        question.user_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.correct_answer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesErrorType =
        selectedErrorType === "all" ||
        question.error_type === selectedErrorType;
      const matchesResolution =
        selectedResolutionStatus === "all" ||
        (selectedResolutionStatus === "resolved" && question.is_resolved) ||
        (selectedResolutionStatus === "unresolved" && !question.is_resolved);

      return matchesSearch && matchesErrorType && matchesResolution;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "last_wrong_at":
          aValue = new Date(a.last_wrong_at).getTime();
          bValue = new Date(b.last_wrong_at).getTime();
          break;
        case "times_wrong":
          aValue = a.times_wrong;
          bValue = b.times_wrong;
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        default:
          aValue = a.error_reason;
          bValue = b.error_reason;
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
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "text-red-600 bg-red-100";
    if (priority >= 5) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const getPriorityStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(level / 2)
            ? "text-red-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleToggleResolution = async (id: string, currentStatus: boolean) => {
    try {
      await updateWrongQuestion({
        id,
        data: { is_resolved: !currentStatus },
      }).unwrap();
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "删除错题",
      message: "确定要删除这道错题吗？删除后无法恢复！",
      type: "danger",
      confirmText: "确认删除",
      cancelText: "取消"
    });
    
    if (confirmed) {
      try {
        await deleteWrongQuestion(id).unwrap();
      } catch (error) {
        console.error("Failed to delete question:", error);
      }
    }
  };

  const openModal = (question: any, mode: "view" | "edit" = "view") => {
    setSelectedWrongQuestion(question);
    setModalMode(mode);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedWrongQuestion(null);
    setModalOpen(false);
  };

  const handleBatchResolve = async () => {
    if (selectedQuestions.length === 0) return;
    try {
      await batchUpdate({
        wrong_question_ids: selectedQuestions,
        action: "resolve",
        value: true,
      }).unwrap();
      setSelectedQuestions([]);
    } catch (error) {
      console.error("Failed to batch resolve:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-6 h-6 bg-gradient-to-br from-red-300 to-orange-300 rounded-full opacity-30 blur-sm"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute top-40 right-20 w-4 h-4 bg-gradient-to-br from-orange-300 to-red-300 rounded-full opacity-25 blur-sm"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10,
          }}
          className="absolute bottom-32 left-1/4 w-8 h-8 bg-gradient-to-br from-yellow-200 to-red-200 rounded-full opacity-20 blur-sm"
        />
      </div>

      {/* Navigation */}
      <AppNavigation />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  错题本
                </h1>
                <p className="text-gray-600 mt-1">智能分析，精准提升</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  } animate-pulse`}
                />
                <span className="text-sm text-gray-500">
                  {isConnected ? "实时同步" : "离线模式"}
                </span>
              </div>

              <Link href="/wrong-questions/import">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  批量导入
                </motion.button>
              </Link>

              <Link href="/wrong-questions/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
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
                boxShadow:
                  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-red-200/50 cursor-pointer group overflow-hidden relative"
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
                    className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                  >
                    {stats.total_wrong}
                  </motion.p>
                </div>
                <motion.div
                  className="p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl group-hover:from-red-200 group-hover:to-orange-200 transition-all"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </motion.div>

                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
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
                boxShadow:
                  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.1,
              }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-green-200/50 cursor-pointer group overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    className="text-sm text-gray-600 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    已解决
                  </motion.p>
                  <motion.p
                    className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                  >
                    {stats.resolved}
                  </motion.p>
                </div>
                <motion.div
                  className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl group-hover:from-green-200 group-hover:to-blue-200 transition-all"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </motion.div>

                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
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
                boxShadow:
                  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.2,
              }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-yellow-200/50 cursor-pointer group overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    className="text-sm text-gray-600 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    待解决
                  </motion.p>
                  <motion.p
                    className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                  >
                    {stats.unresolved}
                  </motion.p>
                </div>
                <motion.div
                  className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl group-hover:from-yellow-200 group-hover:to-orange-200 transition-all"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </motion.div>

                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
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
                boxShadow:
                  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.3,
              }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-purple-200/50 cursor-pointer group overflow-hidden relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    className="text-sm text-gray-600 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    准确率提升
                  </motion.p>
                  <motion.p
                    className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.6 }}
                  >
                    {stats.resolved > 0
                      ? Math.round((stats.resolved / stats.total_wrong) * 100)
                      : 0}
                    %
                  </motion.p>
                </div>
                <motion.div
                  className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl group-hover:from-purple-200 group-hover:to-pink-200 transition-all"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                >
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </motion.div>

                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 3,
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索错题内容、原因..."
                  className="pl-10 pr-4 py-2.5 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3">
                <select
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={selectedErrorType}
                  onChange={(e) => setSelectedErrorType(e.target.value)}
                >
                  <option value="all">所有错误类型</option>
                  {Object.entries(ERROR_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={selectedResolutionStatus}
                  onChange={(e) => setSelectedResolutionStatus(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  <option value="resolved">已解决</option>
                  <option value="unresolved">待解决</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {selectedQuestions.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBatchResolve}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  批量解决 ({selectedQuestions.length})
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  showAdvancedFilters
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                高级筛选
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">排序方式:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="last_wrong_at">最近错误时间</option>
                    <option value="times_wrong">错误次数</option>
                    <option value="priority">优先级</option>
                  </select>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">每页显示:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value={5}>5条</option>
                    <option value={10}>10条</option>
                    <option value={20}>20条</option>
                    <option value={50}>50条</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Wrong Questions Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 mb-8"
        >
          <AnimatePresence mode="popLayout">
            {paginatedQuestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-100/50 text-center"
              >
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  暂无错题记录
                </h3>
                <p className="text-gray-600 mb-6">
                  开始学习，建立你的错题库吧！
                </p>
                <Link href="/questions">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    <Target className="h-5 w-5 mr-2" />
                    开始练习
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              paginatedQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={{
                    scale: 1.01,
                    y: -2,
                    boxShadow:
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
                  }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-red-200/50 hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
                >
                  {/* 错题头部信息 */}
                  <div className="flex items-start space-x-3 mb-4">
                    <motion.input
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions([
                            ...selectedQuestions,
                            question.id,
                          ]);
                        } else {
                          setSelectedQuestions(
                            selectedQuestions.filter((id) => id !== question.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            ERROR_TYPES[
                              question.error_type as keyof typeof ERROR_TYPES
                            ]?.color || "text-gray-600 bg-gray-100"
                          }`}
                        >
                          {
                            ERROR_TYPES[
                              question.error_type as keyof typeof ERROR_TYPES
                            ]?.icon
                          }
                          <span className="ml-1">
                            {ERROR_TYPES[
                              question.error_type as keyof typeof ERROR_TYPES
                            ]?.label || question.error_type}
                          </span>
                        </motion.span>

                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            question.is_resolved
                              ? "text-green-600 bg-green-100"
                              : "text-red-600 bg-red-100"
                          }`}
                        >
                          {question.is_resolved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              已解决
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              待解决
                            </>
                          )}
                        </motion.span>

                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            question.priority
                          )}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getPriorityStars(question.priority)}
                          </div>
                        </motion.span>

                        <motion.span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          错误 {question.times_wrong} 次
                        </motion.span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            错误原因:
                          </p>
                          <p className="text-gray-900 font-medium">
                            {question.error_reason}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              你的答案:
                            </p>
                            <div className="text-red-600 bg-red-50 rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                              <span>{question.user_answer}</span>
                              <TTSButton
                                text={question.user_answer}
                                size="sm"
                                variant="ghost"
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              正确答案:
                            </p>
                            <div className="text-green-600 bg-green-50 rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                              <span>{question.correct_answer}</span>
                              <TTSButton
                                text={question.correct_answer}
                                size="sm"
                                variant="ghost"
                              />
                            </div>
                          </div>
                        </div>

                        {question.notes && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">备注:</p>
                            <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm">
                              {question.notes}
                            </p>
                          </div>
                        )}

                        {question.tags && question.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {question.tags.map((tag, tagIndex) => (
                              <motion.span
                                key={tagIndex}
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100"
                              >
                                {tag}
                              </motion.span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧操作按钮 */}
                    <div className="flex flex-col space-y-2 min-w-[120px]">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal(question, "view")}
                        className="flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all font-medium"
                        title="查看详情"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </motion.button>

                      {/* 三点菜单 */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setDropdownOpenId(
                              dropdownOpenId === question.id
                                ? null
                                : question.id
                            );
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full"
                          title="更多操作"
                        >
                          <MoreHorizontal className="h-4 w-4 mx-auto" />
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
                                  openModal(question, "view");
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                查看详情
                              </button>

                              <button
                                onClick={() => {
                                  openModal(question, "edit");
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <PenTool className="h-4 w-4 mr-3" />
                                编辑错题
                              </button>

                              <button
                                onClick={() => {
                                  handleToggleResolution(
                                    question.id,
                                    question.is_resolved
                                  );
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                {question.is_resolved ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-3" />
                                    标记为未解决
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-3" />
                                    标记为已解决
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  console.log("开始复习:", question.id);
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Target className="h-4 w-4 mr-3" />
                                开始复习
                              </button>

                              <div className="border-t border-gray-100 my-1"></div>

                              <button
                                onClick={() => {
                                  handleDelete(question.id);
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-4 w-4 mr-3" />
                                删除错题
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* 分割线 */}
                  <div className="border-t border-gray-100 my-4"></div>

                  {/* 底部时间信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>最后错误: {formatDate(question.last_wrong_at)}</span>
                    <span>创建时间: {formatDate(question.created_at)}</span>
                  </div>

                  {/* 装饰性光效 */}
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-200/20 to-orange-200/20 rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2,
                    }}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
          >
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>共 {totalQuestions} 条记录</span>
              <span>•</span>
              <span>
                第 {currentPage} 页，共 {totalPages} 页
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronsLeft className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber =
                  currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNumber > totalPages) return null;

                return (
                  <motion.button
                    key={pageNumber}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      currentPage === pageNumber
                        ? "bg-red-600 text-white shadow-lg"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </motion.button>
                );
              })}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronsRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Wrong Question Modal */}
        {selectedWrongQuestion && (
          <WrongQuestionModal
            isOpen={modalOpen}
            onClose={closeModal}
            wrongQuestion={selectedWrongQuestion}
            mode={modalMode}
            onDelete={() => {
              handleDelete(selectedWrongQuestion.id);
              closeModal();
            }}
          />
        )}
        <ConfirmationDialog />
      </div>
    </div>
  );
}
