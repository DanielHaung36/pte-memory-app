'use client'

import { useEffect, useState } from 'react'
import { useReduxAuth } from '@/hooks/useReduxAuth'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import DailyGoal from '@/components/DailyGoal'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  }, [isAuthenticated])
  
  if (!isAuthenticated || !user) {
    return null
  }
  
  const handleModeSelect = (mode: 'smart' | 'challenge') => {
    setSelectedMode(mode)
    
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
  }

  // 获取实际数据或使用默认值
  const actualDueQuestions = dueQuestionsData?.questions || []
  const actualStats = statsData?.statistics || {
    total_questions: 0,
    due_questions: 0,
    questions_due: 0,
    total_reviews_today: 0,
    correct_reviews_today: 0,
    streak: 0,
    accuracy_rate: 0
  }

  // 根据筛选条件过滤题目
  const filteredQuestions = actualDueQuestions.filter(question => {
    if (filterType === 'all') return true
    if (filterType === 'urgent') return (question as any).priority >= 4 || false
    if (filterType === 'overdue') {
      const now = new Date()
      const dueDate = new Date((question as any).nextReviewDate || (question as any).next_review_date || new Date())
      return dueDate < now
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-6 h-6 bg-blue-300 rounded-full opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
          className="absolute top-40 right-20 w-4 h-4 bg-purple-300 rounded-full opacity-25"
        />
      </div>

      <AppNavigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Header */}
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
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-3 rounded-xl transition-colors ${
                    soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshData}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Goal Integration */}
        <div className="mb-8">
          <DailyGoal 
            onStartReview={handleStartReview}
            compact={false}
          />
        </div>

        {/* Enhanced Review Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">{actualStats.due_questions}</div>
                <div className="text-sm opacity-75">待复习题目</div>
                <div className="text-xs opacity-60 mt-1">
                  {actualStats.due_questions > 0 ? '是时候复习了！' : '太棒了！'}
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
                <div className="text-3xl font-bold mb-2">{(actualStats as any).today_reviewed || (actualStats as any).total_reviews_today || 0}</div>
                <div className="text-sm opacity-75">今日已复习</div>
                <div className="text-xs opacity-60 mt-1">
                  正确 {(actualStats as any).correct_reviews_today || 0} 题
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
                <div className="text-3xl font-bold mb-2">{(actualStats as any).streak || 0}</div>
                <div className="text-sm opacity-75">当前连击</div>
                <div className="text-xs opacity-60 mt-1">
                  {((actualStats as any).accuracy_rate || (actualStats as any).average_accuracy || 0).toFixed(1)}% 准确率
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">{filteredQuestions.length}</div>
                <div className="text-sm opacity-75">可复习题目</div>
                <div className="text-xs opacity-60 mt-1">
                  {filterType === 'urgent' ? '紧急' : filterType === 'overdue' ? '逾期' : '全部'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Filters */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  筛选题目
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {(['all', 'urgent', 'overdue'] as const).map((type) => {
                  const labels = {
                    all: '全部题目',
                    urgent: '紧急复习',
                    overdue: '逾期题目'
                  }
                  
                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        filterType === type
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {labels[type]}
                    </motion.button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Mode Selection */}
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
                {/* Smart Review Mode */}
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

                {/* Challenge Mode */}
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
                          最高连击 {(actualStats as any).streak || 0}
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
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          连击奖励机制
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          实时排行榜
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          成就徽章系统
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleModeSelect('challenge')}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        开始连击挑战
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Due Questions List */}
        {filteredQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
                    待复习题目 ({filteredQuestions.length})
                  </span>
                  <Badge className="bg-blue-100 text-blue-600">
                    {filterType === 'urgent' ? '紧急' : filterType === 'overdue' ? '逾期' : '全部'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredQuestions.slice(0, 5).map((question, index) => {
                    const isOverdue = new Date((question as any).nextReviewDate || (question as any).next_review_date || new Date()) < new Date()
                    const priority = (question as any).priority || 1
                    
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className={`w-3 h-3 rounded-full mr-4 ${
                              priority >= 4 ? 'bg-red-500' :
                              priority >= 3 ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{question.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="capitalize">{question.question_type?.replace('_', ' ')}</span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date((question as any).nextReviewDate || (question as any).next_review_date || new Date()).toLocaleDateString('zh-CN')}
                                </span>
                                {isOverdue && (
                                  <Badge className="bg-red-100 text-red-600 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    逾期
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {priority >= 4 && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Flame className="h-4 w-4 text-red-500" />
                              </motion.div>
                            )}
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/review/session?questionId=${question.id}`)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-md transition-all flex items-center space-x-2"
                            >
                              <PlayCircle className="h-4 w-4" />
                              <span>复习</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  
                  {filteredQuestions.length > 5 && (
                    <motion.div
                      className="text-center pt-4 border-t border-gray-200"
                      whileHover={{ scale: 1.02 }}
                    >
                      <button
                        onClick={() => router.push('/questions')}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-2"
                      >
                        <span>查看全部 {filteredQuestions.length} 题</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Questions State */}
        {filteredQuestions.length === 0 && !questionsLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-6"
            >
              {filterType === 'all' ? '🎉' : filterType === 'urgent' ? '😌' : '✨'}
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filterType === 'all' ? '太棒了！' : filterType === 'urgent' ? '没有紧急题目' : '没有逾期题目'}
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filterType === 'all' ? 
                '目前没有需要复习的题目，你可以添加新题目或者享受学习成果。' :
                filterType === 'urgent' ?
                '目前没有紧急需要复习的题目，继续保持学习节奏！' :
                '没有逾期的题目，你的学习计划执行得很好！'
              }
            </p>
            
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/questions/simple')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                添加新题目
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType('all')}
                className="px-6 py-3 bg-white text-gray-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all border border-gray-200"
              >
                查看全部
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {questionsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">加载复习数据中...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}