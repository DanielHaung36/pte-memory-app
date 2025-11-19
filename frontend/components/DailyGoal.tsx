'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Clock, 
  CheckCircle, 
  Flame,
  TrendingUp,
  Star,
  Calendar,
  ArrowUp,
  Coffee,
  Sunrise,
  Sun,
  Moon,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useGetQuestionStatisticsQuery, useGetDueQuestionsQuery } from '@/lib/store/questionsApi';

interface DailyGoalData {
  targetQuestions: number;
  completedQuestions: number;
  streakDays: number;
  averageAccuracy: number;
  timeSpentToday: number; // 分钟
  estimatedTimeRemaining: number; // 分钟
  nextReviewTime: string;
  hasReviewsScheduled: boolean;
  weeklyProgress: number; // 0-100
  levelProgress: number; // 0-100
}

interface TodaySchedule {
  morning: number;
  afternoon: number;
  evening: number;
  completed: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

// 接口定义保持不变，但不再使用模拟数据

interface DailyGoalProps {
  className?: string;
  onStartReview?: () => void;
  compact?: boolean;
}

const DailyGoal: React.FC<DailyGoalProps> = ({ 
  className = '',
  onStartReview,
  compact = false
}) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 获取真实数据
  const { data: statisticsData, isLoading: statisticsLoading, refetch: refetchStats } = useGetQuestionStatisticsQuery();
  const { data: dueQuestionsData, isLoading: dueLoading } = useGetDueQuestionsQuery({ limit: 50 });

  useEffect(() => {
    // 初始设置时间并启动定时器
    setCurrentTime(new Date());
    
    // 每分钟更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 刷新数据
  const refreshData = () => {
    refetchStats();
  };

  // 基于真实数据计算目标完成情况
  const statistics = statisticsData?.statistics;
  const dueQuestions = dueQuestionsData?.questions || [];
  
  // 动态计算今日目标和完成数量
  const todayTarget = Math.max(20, statistics?.due_questions || 20); // 最少20题，或根据待复习题目数调整
  const todayCompleted = statistics?.today_reviewed || 0;
  const progressPercentage = todayTarget > 0 ? (todayCompleted / todayTarget) * 100 : 0;
  const isGoalCompleted = todayCompleted >= todayTarget;
  
  // 检查是否有待复习的题目
  const hasReviewsScheduled = (statistics?.due_questions || 0) > 0;
  
  const getCurrentPeriod = () => {
    if (!currentTime) return 'morning'; // 默认为上午
    const hour = currentTime.getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'morning': return <Sunrise className="h-4 w-4" />;
      case 'afternoon': return <Sun className="h-4 w-4" />;
      case 'evening': return <Moon className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'morning': return '上午';
      case 'afternoon': return '下午';
      case 'evening': return '晚上';
      default: return '';
    }
  };

  const currentPeriod = getCurrentPeriod();
  
  // 生成基于真实数据的时段分布
  const generateSchedule = () => {
    const morningTarget = Math.ceil(todayTarget * 0.4); // 40% 上午
    const afternoonTarget = Math.ceil(todayTarget * 0.4); // 40% 下午  
    const eveningTarget = todayTarget - morningTarget - afternoonTarget; // 剩余晚上
    
    const morningCompleted = Math.min(morningTarget, Math.floor(todayCompleted * 0.5));
    const afternoonCompleted = Math.min(afternoonTarget, Math.floor((todayCompleted - morningCompleted) * 0.7));
    const eveningCompleted = todayCompleted - morningCompleted - afternoonCompleted;
    
    return {
      morning: morningTarget,
      afternoon: afternoonTarget,
      evening: eveningTarget,
      completed: {
        morning: Math.max(0, morningCompleted),
        afternoon: Math.max(0, afternoonCompleted), 
        evening: Math.max(0, eveningCompleted)
      }
    };
  };
  
  const schedule = generateSchedule();

  // 显示加载状态
  if (statisticsLoading || dueLoading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReviewsScheduled) {
    return (
      <div className={`bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl mb-4"
          >
            😴
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            今日暂无复习安排
          </h3>
          <p className="text-gray-600 text-sm">
            享受休息时光，明天继续加油！
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 p-4 cursor-pointer ${className}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isGoalCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
              {isGoalCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Target className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                今日目标: {todayCompleted} / {todayTarget} 题
              </div>
              <div className="text-sm text-gray-600">
                {isGoalCompleted ? '🎉 目标已完成' : `还需 ${todayTarget - todayCompleted} 题`}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${isGoalCompleted ? 'text-green-600' : 'text-blue-600'}`}>
              {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${isGoalCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 ${className}`}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${isGoalCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isGoalCompleted ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
              </motion.div>
            ) : (
              <Target className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isGoalCompleted ? '🎉 今日目标已完成!' : '今日复习目标'}
            </h3>
            <p className="text-gray-600">
              {isGoalCompleted 
                ? '恭喜你完成了今天的学习任务' 
                : `还有${todayTarget - todayCompleted}题等待复习`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={refreshData}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
          
          {(statistics?.weekly_reviewed || 0) > 0 && (
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{Math.floor((statistics?.weekly_reviewed || 0) / 7)}天</span>
            </div>
          )}
        </div>
      </div>

      {/* 主要进度显示 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 进度环 */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <motion.div 
              className="w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(${isGoalCompleted ? '#10b981' : '#3b82f6'} ${progressPercentage * 3.6}deg, #e5e7eb 0deg)`
              }}
            >
              <div className="w-24 h-24 bg-white rounded-full absolute top-4 left-4 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isGoalCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                    {todayCompleted}
                  </div>
                  <div className="text-xs text-gray-500">/ {todayTarget}</div>
                </div>
              </div>
            </motion.div>
            
            {isGoalCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
              >
                <Award className="h-4 w-4" />
              </motion.div>
            )}
          </div>
          
          <div className="mt-4">
            <div className={`text-lg font-semibold ${isGoalCompleted ? 'text-green-600' : 'text-blue-600'}`}>
              {Math.round(progressPercentage)}% 完成
            </div>
            <div className="text-sm text-gray-500">
              {isGoalCompleted ? '目标达成！' : `还需 ${todayTarget - todayCompleted} 题`}
            </div>
          </div>
        </div>

        {/* 时段分布 */}
        <div className="col-span-2">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            今日进度分布
          </h4>
          
          <div className="space-y-4">
            {(['morning', 'afternoon', 'evening'] as const).map((period) => {
              const completed = schedule.completed[period];
              const target = schedule[period];
              const progress = target > 0 ? (completed / target) * 100 : 0;
              const isCurrent = period === currentPeriod;
              
              return (
                <div key={period} className={`flex items-center space-x-4 ${isCurrent ? 'bg-blue-50 p-3 rounded-lg border border-blue-200' : ''}`}>
                  <div className={`p-2 rounded-lg ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {getPeriodIcon(period)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {getPeriodLabel(period)}
                        {isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">当前</span>}
                      </span>
                      <span className="text-sm text-gray-600">
                        {completed} / {target} 题
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          progress >= 100 ? 'bg-green-500' : 
                          isCurrent ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.8, delay: period === 'morning' ? 0 : period === 'afternoon' ? 0.2 : 0.4 }}
                      />
                    </div>
                  </div>
                  
                  {completed >= target && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="font-bold text-lg text-blue-600">{statistics?.due_questions || 0}</div>
          <div className="text-sm text-gray-600">待复习题目</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
          <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="font-bold text-lg text-green-600">{Math.round(statistics?.average_accuracy || 0)}%</div>
          <div className="text-sm text-gray-600">平均准确率</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
          <Star className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="font-bold text-lg text-purple-600">{statistics?.weekly_reviewed || 0}</div>
          <div className="text-sm text-gray-600">本周复习</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center">
          <Zap className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <div className="font-bold text-lg text-orange-600">{statistics?.total_questions || 0}</div>
          <div className="text-sm text-gray-600">总题目数</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {!isGoalCompleted && hasReviewsScheduled && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>还有 {statistics?.due_questions || 0} 题等待复习</span>
            </div>
          )}
        </div>
        
        {!isGoalCompleted && onStartReview && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartReview}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Target className="h-5 w-5" />
            <span>开始复习</span>
          </motion.button>
        )}
        
        {isGoalCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>任务完成！</span>
          </motion.div>
        )}
      </div>

      {/* 激励信息 */}
      {!isGoalCompleted && progressPercentage > 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl"
        >
          <div className="flex items-center space-x-2 text-orange-600">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">
              你已经完成了一半以上，继续保持！距离目标只差一点点了！
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyGoal;