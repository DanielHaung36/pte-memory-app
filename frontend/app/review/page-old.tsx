'use client'

import { useEffect, useState } from 'react'
import { useReduxAuth } from '@/hooks/useReduxAuth'
import { useReview } from '@/contexts/ReviewContext'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import DailyGoal from '@/components/DailyGoal'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, Zap, Clock, Target, TrendingUp, BookOpen, Trophy, Play, Sparkles,
  Volume2, VolumeX, RefreshCw, Settings, Filter, ChevronRight,
  Star, Flame, CheckCircle, AlertCircle, Heart, Coffee, Sunrise,
  Calendar, Award, BarChart3, TimerIcon, PlayCircle
} from 'lucide-react'
import { redirect, useRouter } from 'next/navigation'
import { useGetDueQuestionsQuery, useGetQuestionStatisticsQuery } from '@/lib/store/questionsApi'

export default function ReviewPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useReduxAuth()
  const { reviewStats, dueReviews, loadDueReviews, loadReviewStats, setGameMode, isGameMode } = useReview()
  const [selectedMode, setSelectedMode] = useState<'smart' | 'challenge' | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'overdue'>('all')
  const [showSettings, setShowSettings] = useState(false)
  
  // 使用真实API数据
  const { 
    data: dueQuestionsData, 
    isLoading: questionsLoading, 
    error: questionsError,
    refetch: refetchQuestions
  } = useGetDueQuestionsQuery({})
  
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetQuestionStatisticsQuery()
  
  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/auth/login")
      return
    }
    
    // 使用新的API数据替代旧的context方法
    if (!questionsLoading && dueQuestionsData) {
      // 可以在这里处理数据
    }
  }, [isAuthenticated, questionsLoading, dueQuestionsData])
  
  if (!isAuthenticated || !user) {
    return null
  }
  
  const handleModeSelect = (mode: 'smart' | 'challenge') => {
    setSelectedMode(mode)
    if (mode === 'challenge') {
      setGameMode(true)
    }
    
    // 导航到实际的复习会话
    if (mode === 'smart') {
      router.push('/review/session?mode=smart')
    } else {
      router.push('/review/session?mode=challenge')
    }
  }

  const handleStartReview = () => {
    router.push('/review/session')
  }

  const refreshData = () => {
    refetchQuestions()
    loadReviewStats()
  }

  // 获取实际数据或使用默认值
  const actualDueQuestions = dueQuestionsData?.questions || dueReviews || []
  const actualStats = statsData?.statistics || reviewStats

  // 根据筛选条件过滤题目
  const filteredQuestions = actualDueQuestions.filter(question => {
    if (filterType === 'all') return true
    if (filterType === 'urgent') return (question as any).priority >= 4 || false
    if (filterType === 'overdue') {
      const now = new Date()
      const dueDate = new Date((question as any).nextReviewDate || (question as any).created_at || new Date())
      return dueDate < now
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      <AppNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  复习中心
                </h1>
                <p className="text-gray-600 mt-2 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  开始你的智能复习之旅，基于艾宾浩斯遗忘曲线
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{reviewStats.streak}</div>
                  <div className="text-xs text-gray-500">连击天数</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Review Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">{reviewStats.questions_due}</div>
                <div className="text-sm opacity-75">待复习题目</div>
                <div className="text-xs opacity-60 mt-1">
                  {reviewStats.questions_due > 0 ? '是时候复习了！' : '太棒了！'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">{reviewStats.total_reviews_today}</div>
                <div className="text-sm opacity-75">今日已复习</div>
                <div className="text-xs opacity-60 mt-1">
                  正确 {reviewStats.correct_reviews_today} 题
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">{reviewStats.streak}</div>
                <div className="text-sm opacity-75">当前连击</div>
                <div className="text-xs opacity-60 mt-1">
                  {reviewStats.accuracy_rate.toFixed(1)}% 准确率
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Review Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                选择复习模式
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group cursor-pointer ${selectedMode === 'smart' ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleModeSelect('smart')}
                >
                  <Card className="border-2 border-transparent group-hover:border-blue-300 group-hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                      <div className="flex items-center mb-4">
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4"
                        >
                          <Brain className="h-8 w-8" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold">智能复习</h3>
                          <p className="text-blue-100 text-sm">AI科学安排</p>
                        </div>
                      </div>
                      <p className="text-blue-100 mb-4">基于艾宾浩斯遗忘曲线，智能安排复习顺序，效率更高</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <Badge className="bg-white/20 text-white">推荐模式</Badge>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          平均 15 分钟
                        </span>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          根据遗忘规律优先安排
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          自适应难度调整
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          详细学习分析
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleModeSelect('smart')}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        开始智能复习
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, rotateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group cursor-pointer ${selectedMode === 'challenge' ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => handleModeSelect('challenge')}
                >
                  <Card className="border-2 border-transparent group-hover:border-green-300 group-hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white relative">
                      <div className="flex items-center mb-4">
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4"
                        >
                          <Zap className="h-8 w-8" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold">连击挑战</h3>
                          <p className="text-green-100 text-sm">激情与速度</p>
                        </div>
                      </div>
                      <p className="text-green-100 mb-4">连续答对获得高分奖励，挑战你的学习极限</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <Badge className="bg-white/20 text-white">挑战模式</Badge>
                        <span className="flex items-center">
                          <Trophy className="h-3 w-3 mr-1" />
                          最高连击 {reviewStats.streak}
                        </span>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-2 right-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-5 w-5 text-yellow-300" />
                        </motion.div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          连击倍数奖励系统
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          实时排行榜竞争
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          特殊成就解锁
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleModeSelect('challenge')}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        开始连击挑战
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Due Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-purple-600" />
                  <span className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    待复习题目
                  </span>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {dueReviews.length} 题
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {dueReviews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="text-8xl mb-6"
                    >
                      🎉
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">太棒了！</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      你已经完成了所有计划的复习内容。<br />
                      可以添加新的题目或尝试其他学习方式。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
                        <a href="/questions/add">
                          <BookOpen className="h-4 w-4 mr-2" />
                          添加新题目
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300">
                        <a href="/games">
                          <Trophy className="h-4 w-4 mr-2" />
                          试试小游戏
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {dueReviews.slice(0, 5).map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.question.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Badge variant="outline" className="text-xs">
                                {review.question.question_type}
                              </Badge>
                              <span>难度 {review.question.difficulty_level}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`${
                              review.ease_factor > 2.5 ? 'bg-green-100 text-green-800' : 
                              review.ease_factor > 2.0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            熟练度 {review.ease_factor.toFixed(1)}
                          </Badge>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            开始复习
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {dueReviews.length > 5 && (
                      <div className="text-center mt-6">
                        <Button variant="outline" className="hover:bg-blue-50">
                          查看更多 ({dueReviews.length - 5} 题)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}