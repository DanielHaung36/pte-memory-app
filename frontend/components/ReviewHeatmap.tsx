'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Flame, 
  CheckCircle,
  Clock,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { useGetReviewHistoryQuery } from '@/lib/store/questionsApi';

interface ReviewDayData {
  date: string;
  reviewCount: number;
  streakDay: boolean;
  accuracy: number;
  timeSpent: number; // 分钟
  completedGoal: boolean;
}

interface ReviewHeatmapProps {
  className?: string;
  showStats?: boolean;
  onDateClick?: (date: string, data: ReviewDayData) => void;
}

// 生成模拟数据 - 后续需要替换为真实数据
const generateMockData = (startDate: Date, days: number): ReviewDayData[] => {
  const data: ReviewDayData[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const reviewCount = Math.floor(Math.random() * 25); // 0-25题
    const accuracy = reviewCount > 0 ? Math.floor(Math.random() * 40 + 60) : 0; // 60-100%
    const timeSpent = reviewCount > 0 ? Math.floor(Math.random() * 45 + 5) : 0; // 5-50分钟
    
    data.push({
      date: dateStr,
      reviewCount,
      streakDay: reviewCount >= 10,
      accuracy,
      timeSpent,
      completedGoal: reviewCount >= 15
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
};

// 填充缺失日期的数据，确保有365天的完整记录
const fillMissingDates = (data: ReviewDayData[], days: number): ReviewDayData[] => {
  const result: ReviewDayData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 查找该日期的真实数据
    const existingData = data.find(d => d.date === dateStr);
    
    if (existingData) {
      result.push(existingData);
    } else {
      // 没有数据的日期填充为0
      result.push({
        date: dateStr,
        reviewCount: 0,
        streakDay: false,
        accuracy: 0,
        timeSpent: 0,
        completedGoal: false
      });
    }
  }
  
  return result;
};

const ReviewHeatmap: React.FC<ReviewHeatmapProps> = ({ 
  className = '', 
  showStats = true,
  onDateClick 
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ReviewDayData[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 获取真实复习历史数据
  const { data: reviewHistoryData, isLoading: reviewHistoryLoading } = useGetReviewHistoryQuery({ days: 365 });

  useEffect(() => {
    // 标记为客户端渲染
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (reviewHistoryData?.reviews && isClient) {
      // 转换API数据为组件所需格式
      const transformedData = reviewHistoryData.reviews.map(review => ({
        date: review.date,
        reviewCount: review.review_count,
        streakDay: review.streak_day,
        accuracy: review.accuracy_rate,
        timeSpent: review.time_spent,
        completedGoal: review.completed_goal
      }));

      // 填充缺失日期的数据
      const filledData = fillMissingDates(transformedData, 365);
      setReviewData(filledData);
    }
  }, [reviewHistoryData, isClient]);

  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 5) return 1;
    if (count <= 10) return 2;
    if (count <= 15) return 3;
    return 4;
  };

  const getIntensityColor = (level: number): string => {
    const colors = [
      'bg-gray-100 border-gray-200 hover:bg-gray-200', // 无活动
      'bg-green-100 border-green-200 hover:bg-green-200', // 低强度
      'bg-green-300 border-green-400 hover:bg-green-400', // 中低强度
      'bg-green-500 border-green-600 hover:bg-green-600', // 中高强度
      'bg-green-700 border-green-800 hover:bg-green-800'  // 高强度
    ];
    return colors[level] || colors[0];
  };

  const getTooltipInfo = (data: ReviewDayData) => {
    if (!data || !data.date) {
      return "无数据";
    }
    const date = new Date(data.date);
    const dateStr = date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    
    if (data.reviewCount === 0) {
      return `${dateStr}\n无复习记录`;
    }
    
    return `${dateStr}\n复习了 ${data.reviewCount} 题\n准确率: ${data.accuracy}%\n用时: ${data.timeSpent} 分钟${data.completedGoal ? '\n✓ 完成目标' : ''}`;
  };

  const handleDateClick = (data: ReviewDayData) => {
    setSelectedDate(data.date);
    onDateClick?.(data.date, data);
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalReviews = reviewData.reduce((sum, day) => sum + day.reviewCount, 0);
    const activeDays = reviewData.filter(day => day.reviewCount > 0).length;
    const streakDays = reviewData.filter(day => day.streakDay).length;
    const avgAccuracy = reviewData.filter(day => day.reviewCount > 0)
      .reduce((sum, day, _, arr) => sum + day.accuracy / arr.length, 0);
    const totalTimeSpent = reviewData.reduce((sum, day) => sum + day.timeSpent, 0);
    
    // 计算当前连续复习天数 (只在客户端计算)
    let currentStreak = 0;
    if (isClient) {
      const today = new Date().toISOString().split('T')[0];
      const sortedData = [...reviewData].sort((a, b) => b.date.localeCompare(a.date));
      
      for (const day of sortedData) {
        if (day.date > today) continue;
        if (day.reviewCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    return {
      totalReviews,
      activeDays,
      streakDays,
      avgAccuracy: Math.round(avgAccuracy) || 0,
      totalTimeSpent,
      currentStreak
    };
  }, [reviewData, isClient]);

  // 生成日历网格 (只在客户端生成)
  const generateCalendarGrid = () => {
    if (!isClient) return [];
    
    const weeks = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364); // 过去一年
    
    // 调整到周日开始（更符合日历习惯）
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    for (let week = 0; week < 53; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const data = reviewData.find(d => d.date === dateStr);
        
        if (data) {
          days.push(data);
        } else {
          days.push({
            date: dateStr,
            reviewCount: 0,
            streakDay: false,
            accuracy: 0,
            timeSpent: 0,
            completedGoal: false
          });
        }
      }
      weeks.push(days);
    }
    
    return weeks;
  };

  const calendarGrid = generateCalendarGrid();
  const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 服务端渲染时或数据加载时显示加载状态
  if (!isClient || reviewHistoryLoading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                复习热力图
              </h3>
              <p className="text-gray-600 text-sm">
                过去一年的复习活动，颜色越深代表复习越多
              </p>
            </div>
          </div>
          {showStats && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-green-600 animate-pulse">-</div>
                <div className="text-gray-500">总复习题数</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-600 animate-pulse">-</div>
                <div className="text-gray-500">活跃天数</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-orange-600 animate-pulse">-</div>
                <div className="text-gray-500">连续天数</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 ${className}`}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              复习热力图
            </h3>
            <p className="text-gray-600 text-sm">
              过去一年的复习活动，颜色越深代表复习越多
            </p>
          </div>
        </div>
        
        {showStats && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg text-green-600">{stats.totalReviews}</div>
              <div className="text-gray-500">总复习题数</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-600">{stats.activeDays}</div>
              <div className="text-gray-500">活跃天数</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-600">{stats.currentStreak}</div>
              <div className="text-gray-500">连续天数</div>
            </div>
          </div>
        )}
      </div>

      {/* 月份标签 */}
      <div className="flex justify-start text-xs text-gray-500 mb-2 ml-14">
        <div className="grid grid-cols-12 gap-4 flex-1">
          {monthLabels.map((month, index) => (
            <div key={index} className="text-left">
              {month}
            </div>
          ))}
        </div>
      </div>

      {/* 日历热力图 */}
      <div className="relative flex">
        {/* 星期标签 */}
        <div className="flex flex-col justify-between text-xs text-gray-500 mr-2" style={{ height: '91px' }}>
          {weekLabels.filter((_, index) => index % 2 === 1).map((label, index) => (
            <div key={index} className="h-3 flex items-center">
              {label}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="flex space-x-1 relative">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1">
              {week.map((day, dayIndex) => {
                const intensity = getIntensityLevel(day.reviewCount);
                const isToday = isClient ? day.date === new Date().toISOString().split('T')[0] : false;
                const isSelected = selectedDate === day.date;
                const isHovered = hoveredDate === day.date;
                
                return (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      w-3 h-3 rounded-sm border cursor-pointer transition-all relative
                      ${getIntensityColor(intensity)}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                      ${isSelected ? 'ring-2 ring-purple-400 scale-125' : ''}
                      ${isHovered ? 'ring-1 ring-gray-400' : ''}
                    `}
                    title={getTooltipInfo(day)}
                  >
                    {/* 特殊标记 - 连击天数 */}
                    {day.streakDay && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    
                    {/* 今日标记 */}
                    {isToday && (
                      <div className="absolute inset-0 border border-blue-400 rounded-sm animate-pulse"></div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* 悬停提示 */}
          <AnimatePresence>
            {hoveredDate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-pre-line max-w-xs">
                  {getTooltipInfo(reviewData.find(d => d.date === hoveredDate)!)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 图例和详细统计 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        {/* 强度图例 */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">少</span>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm border ${getIntensityColor(level).split(' hover:')[0]}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">多</span>
          
          <div className="flex items-center space-x-1 ml-4">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">连击日</span>
          </div>
        </div>

        {/* 详细统计 */}
        {showStats && (
          <div className="flex items-center space-x-6 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>平均准确率: {stats.avgAccuracy}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>总用时: {Math.round(stats.totalTimeSpent / 60)}h</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span>连击天数: {stats.streakDays}</span>
            </div>
          </div>
        )}
      </div>

      {/* 选中日期的详细信息 */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-4 border-t border-gray-100"
          >
            {(() => {
              const selectedData = reviewData.find(d => d.date === selectedDate);
              if (!selectedData) return null;
              
              const date = new Date(selectedData.date);
              const dateStr = date.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              });
              
              return (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateStr}
                  </h4>
                  
                  {selectedData.reviewCount === 0 ? (
                    <div className="text-gray-500 text-center py-4">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>这一天没有复习记录</p>
                      <p className="text-xs mt-1">开始复习来点亮这一天吧！</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center bg-white/80 rounded-lg p-3"
                      >
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedData.reviewCount}
                        </div>
                        <div className="text-sm text-gray-500">复习题数</div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center bg-white/80 rounded-lg p-3"
                      >
                        <div className="text-2xl font-bold text-green-600">
                          {selectedData.accuracy}%
                        </div>
                        <div className="text-sm text-gray-500">准确率</div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center bg-white/80 rounded-lg p-3"
                      >
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedData.timeSpent}
                        </div>
                        <div className="text-sm text-gray-500">分钟</div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center bg-white/80 rounded-lg p-3"
                      >
                        <div className="text-2xl flex justify-center">
                          {selectedData.completedGoal ? (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          ) : (
                            <div className="h-8 w-8 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">目标完成</div>
                      </motion.div>
                    </div>
                  )}
                  
                  {/* 关闭按钮 */}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewHeatmap;