"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Play,
  Pause,
  Volume2,
  Star,
  Calendar,
  Clock,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Mic,
  PenTool,
  Headphones,
  Share2,
  Bookmark,
  Copy,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useGetQuestionQuery, useDeleteQuestionMutation } from "@/lib/store/questionsApi";
import { toast } from "react-hot-toast";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import TTSButton from "@/components/ui/TTSButton";
import { useConfirm } from "@/hooks/useConfirm";

const QUESTION_TYPES = {
  speaking: { label: "口语", icon: <Mic className="h-4 w-4" />, color: "text-pink-600 bg-pink-100 border-pink-200" },
  writing: { label: "写作", icon: <PenTool className="h-4 w-4" />, color: "text-purple-600 bg-purple-100 border-purple-200" },
  reading: { label: "阅读", icon: <Eye className="h-4 w-4" />, color: "text-blue-600 bg-blue-100 border-blue-200" },
  listening: { label: "听力", icon: <Headphones className="h-4 w-4" />, color: "text-green-600 bg-green-100 border-green-200" },
};

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  
  const { data: questionData, isLoading, error } = useGetQuestionQuery(questionId);
  const [deleteQuestion, { isLoading: deleting }] = useDeleteQuestionMutation();
  const { confirm, ConfirmationDialog } = useConfirm();
  
  const [isPlaying, setIsPlaying] = useState(false);

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
            <p className="text-gray-600">加载题目详情中...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">题目不存在</h2>
            <p className="text-gray-600 mb-4">该题目可能已被删除或不存在</p>
            <Link href="/questions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回题库
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const question = questionData?.question;
  
  if (!question) return null;

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "删除题目",
      message: "确定要删除这道题目吗？删除后无法恢复！",
      type: "danger",
      confirmText: "确认删除",
      cancelText: "取消"
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteQuestion(questionId).unwrap();
      
      toast.success("题目删除成功", {
        icon: "🗑️",
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });
      
      router.push("/questions");
    } catch (error) {
      toast.error("删除失败，请重试", {
        icon: "❌",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600 bg-green-100 border-green-200";
    if (accuracy >= 60) return "text-yellow-600 bg-yellow-100 border-yellow-200";
    return "text-red-600 bg-red-100 border-red-200";
  };

  const typeConfig = QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/questions">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">题目详情</h1>
                <p className="text-gray-600">查看完整题目信息</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                title="复制链接"
              >
                <Copy className="h-5 w-5" />
              </motion.button>
              
              <Link href={`/questions/edit/${questionId}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  编辑
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Question Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${typeConfig?.color || "text-gray-600 bg-gray-100 border-gray-200"}`}>
                    {typeConfig?.icon}
                    <span className="ml-2">{typeConfig?.label || question.question_type}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(question.difficulty_level)}
                  </div>

                  {question.question_stats && question.question_stats.accuracy_rate > 0 && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      getAccuracyColor(question.question_stats.accuracy_rate)
                    }`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {Math.round(question.question_stats.accuracy_rate)}% 准确率
                    </div>
                  )}

                  {question.review_schedule?.is_mastered && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100 border border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已掌握
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-4">{question.title}</h1>
                  <TTSButton text={question.title} size="md" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">题目内容</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {question.content}
                    </p>
                  </div>
                </div>
                <TTSButton text={question.content} size="md" className="ml-4 flex-shrink-0" />
              </div>
            </div>

            {/* Explanations */}
            {question.explanations && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      解析说明
                    </h3>
                    <div className="prose prose-blue max-w-none">
                      <p className="text-blue-900 leading-relaxed whitespace-pre-wrap">
                        {question.explanations}
                      </p>
                    </div>
                  </div>
                  <TTSButton text={question.explanations} size="sm" className="ml-4 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Audio */}
            {question.audio_url && (
              <div className="bg-green-50 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-medium text-green-700 mb-3 flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  音频内容
                </h3>
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isPlaying ? "暂停" : "播放"}
                  </motion.button>
                  <a 
                    href={question.audio_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    打开音频文件
                  </a>
                </div>
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                基本信息
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">创建时间</span>
                  <span className="text-gray-900 font-medium">{formatDate(question.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">最后更新</span>
                  <span className="text-gray-900 font-medium">{formatDate(question.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">难度等级</span>
                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(question.difficulty_level)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Review Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                复习信息
              </h2>
              {question.review_schedule ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">下次复习</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(question.review_schedule.next_review_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">复习间隔</span>
                    <span className="text-gray-900 font-medium">
                      {question.review_schedule.current_interval} 天
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">掌握状态</span>
                    <div className="flex items-center space-x-2">
                      {question.review_schedule.is_mastered ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">已掌握</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-600 font-medium">学习中</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">暂无复习记录</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Performance Statistics */}
          {question.question_stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                学习统计
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {question.question_stats.times_reviewed}
                  </div>
                  <div className="text-sm text-gray-600">复习次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {question.question_stats.correct_count}
                  </div>
                  <div className="text-sm text-gray-600">答对次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {question.question_stats.wrong_count}
                  </div>
                  <div className="text-sm text-gray-600">答错次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {Math.round(question.question_stats.accuracy_rate)}%
                  </div>
                  <div className="text-sm text-gray-600">准确率</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">掌握进度</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(question.question_stats.accuracy_rate)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${question.question_stats.accuracy_rate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            <div className="flex flex-wrap gap-4">
              <Link href={`/review/session?question=${questionId}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始复习
                </motion.button>
              </Link>
              
              <Link href={`/questions/edit/${questionId}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  编辑题目
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigator.share({ title: question.title, url: window.location.href })}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除题目
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
      <ConfirmationDialog />
    </div>
  );
}