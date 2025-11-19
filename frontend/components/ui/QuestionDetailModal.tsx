"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, BarChart3, Star, Headphones, Mic, PenTool, Eye, Target, CheckCircle2, XCircle, AlertCircle, Volume2 } from 'lucide-react';
import { Question } from '@/lib/store/questionsApi';
import TTSButton from '@/components/ui/TTSButton';

interface QuestionDetailModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

const QUESTION_TYPES = {
  speaking: { 
    label: "口语", 
    icon: <Mic className="h-4 w-4" />, 
    color: "text-pink-600 bg-pink-100",
    bgGradient: "from-pink-50 to-rose-50"
  },
  writing: { 
    label: "写作", 
    icon: <PenTool className="h-4 w-4" />, 
    color: "text-purple-600 bg-purple-100",
    bgGradient: "from-purple-50 to-violet-50"
  },
  reading: { 
    label: "阅读", 
    icon: <Eye className="h-4 w-4" />, 
    color: "text-blue-600 bg-blue-100",
    bgGradient: "from-blue-50 to-cyan-50"
  },
  listening: { 
    label: "听力", 
    icon: <Headphones className="h-4 w-4" />, 
    color: "text-green-600 bg-green-100",
    bgGradient: "from-green-50 to-teal-50"
  },
};

export default function QuestionDetailModal({ question, isOpen, onClose }: QuestionDetailModalProps) {
  if (!question) return null;

  const questionTypeConfig = QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES] || {
    label: question.question_type,
    icon: <Target className="h-4 w-4" />,
    color: "text-gray-600 bg-gray-100",
    bgGradient: "from-gray-50 to-gray-100"
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
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
    if (accuracy >= 80) return "text-green-600 bg-green-100";
    if (accuracy >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getMasteryStatus = () => {
    if (question.review_schedule?.is_mastered) {
      return { icon: CheckCircle2, text: "已掌握", color: "text-green-600 bg-green-100" };
    }
    if (question.question_stats && question.question_stats.times_reviewed > 0) {
      const accuracy = question.question_stats.accuracy_rate;
      if (accuracy >= 80) {
        return { icon: CheckCircle2, text: "良好", color: "text-blue-600 bg-blue-100" };
      } else if (accuracy >= 60) {
        return { icon: AlertCircle, text: "一般", color: "text-yellow-600 bg-yellow-100" };
      } else {
        return { icon: XCircle, text: "需加强", color: "text-red-600 bg-red-100" };
      }
    }
    return { icon: Target, text: "未复习", color: "text-gray-600 bg-gray-100" };
  };

  const masteryStatus = getMasteryStatus();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${questionTypeConfig.bgGradient} px-6 py-4 border-b border-gray-100`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${questionTypeConfig.color}`}>
                    {questionTypeConfig.icon}
                    <span className="ml-2">{questionTypeConfig.label}</span>
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

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${masteryStatus.color}`}>
                    <masteryStatus.icon className="h-3 w-3 mr-1" />
                    {masteryStatus.text}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Title Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex-1">{question.title}</h2>
                    <TTSButton text={question.title} size="sm" className="ml-3" />
                  </div>
                </div>

                {/* Content Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-500" />
                      题目内容
                    </h3>
                    <TTSButton text={question.content} size="sm" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{question.content}</p>
                  </div>
                </div>

                {/* Answer Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      正确答案
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                      <div className="flex items-start justify-between">
                        <p className="text-green-800 font-medium flex-1">{question.correct_answer}</p>
                        <TTSButton text={question.correct_answer} size="sm" className="ml-2" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-500" />
                      我的回答
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                      <div className="flex items-start justify-between">
                        <p className="text-red-800 font-medium flex-1">{question.user_answer}</p>
                        <TTSButton text={question.user_answer} size="sm" className="ml-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                      详细解析
                    </h3>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <p className="text-purple-800 leading-relaxed whitespace-pre-wrap flex-1">{question.explanation}</p>
                        <TTSButton text={question.explanation} size="sm" className="ml-2" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio */}
                {question.audio_url && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Volume2 className="h-5 w-5 mr-2 text-indigo-500" />
                      音频文件
                    </h3>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <audio controls className="w-full">
                        <source src={question.audio_url} type="audio/mpeg" />
                        您的浏览器不支持音频播放。
                      </audio>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">基本信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          创建时间
                        </span>
                        <span className="font-medium">{formatDate(question.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          更新时间
                        </span>
                        <span className="font-medium">{formatDate(question.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">分数</span>
                        <span className="font-medium">{question.points} 分</span>
                      </div>
                      {question.time_limit && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">时间限制</span>
                          <span className="font-medium">{question.time_limit} 秒</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Stats */}
                  {question.question_stats && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800">复习统计</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">复习次数</span>
                          <span className="font-medium">{question.question_stats.times_reviewed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">正确次数</span>
                          <span className="font-medium text-green-600">{question.question_stats.times_correct}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">错误次数</span>
                          <span className="font-medium text-red-600">{question.question_stats.times_wrong}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">平均用时</span>
                          <span className="font-medium">{Math.round(question.question_stats.average_response_time)}s</span>
                        </div>
                        {question.question_stats.last_correct_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">最后正确</span>
                            <span className="font-medium text-green-600">
                              {formatDate(question.question_stats.last_correct_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Schedule */}
                {question.review_schedule && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">复习计划</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">当前间隔</span>
                          <span className="font-medium">{question.review_schedule.current_interval} 天</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">容易度</span>
                          <span className="font-medium">{question.review_schedule.ease_factor.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">重复次数</span>
                          <span className="font-medium">{question.review_schedule.repetition_count}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">优先级</span>
                          <span className="font-medium">{question.review_schedule.priority}</span>
                        </div>
                        {question.review_schedule.next_review_date && (
                          <div className="flex items-center justify-between md:col-span-2">
                            <span className="text-gray-600">下次复习</span>
                            <span className="font-medium text-blue-600">
                              {formatDate(question.review_schedule.next_review_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}