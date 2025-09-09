"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Volume2,
  SkipForward,
  RotateCcw,
  Target,
  TrendingUp,
  BookOpen,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useGetDueQuestionsQuery, useReviewQuestionMutation } from "@/lib/store/questionsApi";
import { useWebSocket } from "@/lib/websocket/client";
import AppNavigation from "@/components/ui/navigation/AppNavigation";

const CONFIDENCE_LEVELS = [
  { level: 1, label: "很困难", color: "bg-red-500", description: "完全不记得" },
  { level: 2, label: "困难", color: "bg-orange-500", description: "想起来有点困难" },
  { level: 3, label: "一般", color: "bg-yellow-500", description: "想了一会儿记起来" },
  { level: 4, label: "简单", color: "bg-green-500", description: "比较容易想起来" },
  { level: 5, label: "很简单", color: "bg-blue-500", description: "立即想起来" },
];

const REVIEW_MODES = {
  smart: { name: "智能复习", icon: <Zap className="w-5 h-5" />, description: "基于遗忘曲线的智能安排" },
  challenge: { name: "挑战模式", icon: <Target className="w-5 h-5" />, description: "只显示困难题目" },
  all: { name: "全部复习", icon: <BookOpen className="w-5 h-5" />, description: "复习所有到期题目" }
};

export default function ReviewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'smart';
  
  const { data: questionsData, isLoading, refetch } = useGetDueQuestionsQuery({ 
    limit: mode === 'challenge' ? 10 : 20 
  });
  const [reviewQuestion] = useReviewQuestionMutation();
  const { isConnected } = useWebSocket();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    timeSpent: 0
  });
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = questionsData?.questions || [];
  const currentQuestion = questions[currentIndex];
  
  // 过滤题目模式
  const filteredQuestions = React.useMemo(() => {
    if (!questions.length) return [];
    
    switch (mode) {
      case 'challenge':
        return questions.filter(q => q.difficulty_level >= 4);
      case 'smart':
        return questions.sort((a, b) => {
          // 优先级：到期时间越久的越优先
          const aOverdue = new Date((a as any).next_review_date || new Date()).getTime() - Date.now();
          const bOverdue = new Date((b as any).next_review_date || new Date()).getTime() - Date.now();
          return aOverdue - bOverdue;
        });
      default:
        return questions;
    }
  }, [questions, mode]);

  useEffect(() => {
    setSessionStats(prev => ({ ...prev, total: filteredQuestions.length }));
  }, [filteredQuestions]);

  useEffect(() => {
    if (filteredQuestions.length === 0 && !isLoading) {
      toast.success("🎉 恭喜！暂时没有需要复习的题目了");
      router.push('/review');
    }
  }, [filteredQuestions, isLoading, router]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleConfidenceSelect = async (confidenceLevel: number, isCorrect: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const responseTime = Date.now() - questionStartTime;
      
      await reviewQuestion({
        question_id: currentQuestion.id,
        is_correct: isCorrect,
        confidence_level: confidenceLevel,
        response_time: responseTime
      }).unwrap();

      setSessionStats(prev => ({
        ...prev,
        [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1,
        timeSpent: prev.timeSpent + responseTime
      }));

      // 移到下一题
      if (currentIndex < filteredQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
        setUserAnswer("");
        setQuestionStartTime(Date.now());
        toast.success(isCorrect ? "✅ 答对了！" : "📝 已记录，继续加油！");
      } else {
        // 完成复习
        completeSession();
      }
    } catch (error: any) {
      toast.error("提交失败: " + (error?.data?.error || "请重试"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSession = () => {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    
    toast.success(`🎯 复习完成！\n正确率: ${accuracy}%\n用时: ${Math.floor(totalTime / 60)}分${totalTime % 60}秒`, {
      duration: 5000,
    });
    
    router.push('/review');
  };

  const skipQuestion = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setUserAnswer("");
      setQuestionStartTime(Date.now());
    } else {
      completeSession();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载复习题目...</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">太棒了！</h2>
            <p className="text-gray-600 mb-6">暂时没有需要复习的题目</p>
            <Link href="/review" className="btn-primary">
              返回复习中心
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/review">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </motion.button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                  {REVIEW_MODES[mode as keyof typeof REVIEW_MODES]?.icon || <BookOpen className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {REVIEW_MODES[mode as keyof typeof REVIEW_MODES]?.name || '复习模式'}
                  </h1>
                  <p className="text-gray-600">
                    {REVIEW_MODES[mode as keyof typeof REVIEW_MODES]?.description || '智能复习'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentIndex + 1}/{filteredQuestions.length}
                </div>
                <div className="text-sm text-gray-500">进度</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-gray-500">正确</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 题目卡片 */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentQuestion?.question_type === 'speaking' ? 'bg-pink-100 text-pink-700' :
                      currentQuestion?.question_type === 'writing' ? 'bg-purple-100 text-purple-700' :
                      currentQuestion?.question_type === 'reading' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {currentQuestion?.question_type === 'speaking' ? '口语' :
                       currentQuestion?.question_type === 'writing' ? '写作' :
                       currentQuestion?.question_type === 'reading' ? '阅读' : '听力'}
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(currentQuestion?.difficulty_level || 1)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={skipQuestion}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <SkipForward className="h-4 w-4" />
                    <span>跳过</span>
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {currentQuestion?.title}
                  </h2>
                  <div className="text-gray-700 leading-relaxed">
                    {currentQuestion?.content}
                  </div>
                </div>

                {currentQuestion?.audio_url && (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <Volume2 className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800">音频播放功能</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    你的答案
                  </label>
                  <textarea
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="请输入你的答案..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {!showAnswer && (
                  <div className="text-center">
                    <motion.button
                      onClick={handleShowAnswer}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary"
                    >
                      查看答案
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* 答案展示 */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">标准答案</h3>
                    <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-gray-800 leading-relaxed">
                        {currentQuestion?.correct_answer}
                      </p>
                    </div>

                    {currentQuestion?.explanation && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">解析</h4>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-gray-700">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 信心评级 */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">回答情况评估</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 正确 */}
                        <div className="space-y-3">
                          <div className="text-center text-sm font-medium text-gray-700 mb-3">
                            ✅ 我答对了
                          </div>
                          {CONFIDENCE_LEVELS.map((conf) => (
                            <motion.button
                              key={`correct-${conf.level}`}
                              onClick={() => handleConfidenceSelect(conf.level, true)}
                              disabled={isSubmitting}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full p-3 ${conf.color} text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
                            >
                              {conf.label} - {conf.description}
                            </motion.button>
                          ))}
                        </div>

                        {/* 错误 */}
                        <div className="space-y-3">
                          <div className="text-center text-sm font-medium text-gray-700 mb-3">
                            ❌ 我答错了
                          </div>
                          {CONFIDENCE_LEVELS.map((conf) => (
                            <motion.button
                              key={`wrong-${conf.level}`}
                              onClick={() => handleConfidenceSelect(conf.level, false)}
                              disabled={isSubmitting}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full p-3 ${conf.color} text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
                            >
                              {conf.label} - {conf.description}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}