"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Award,
  Brain,
  Zap,
  Calendar,
  Users,
  BookOpen,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import { 
  useGetDashboardStatsQuery,
  useGetLearningTrendsQuery,
  useGetPersonalizedInsightsQuery,
  analyticsUtils 
} from '@/lib/store/analyticsApi';
import ReviewHeatmap from './ReviewHeatmap';
import LearningTrends from './LearningTrends';
import SubjectPerformance from './SubjectPerformance';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface EnhancedAnalyticsDashboardProps {
  className?: string;
}

export default function EnhancedAnalyticsDashboard({ 
  className = '' 
}: EnhancedAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'heatmap' | 'insights' | 'achievements'>('overview');

  // API queries
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useGetDashboardStatsQuery();

  const { 
    data: trendsData, 
    isLoading: isTrendsLoading 
  } = useGetLearningTrendsQuery({ period: selectedPeriod });

  const { 
    data: insightsData, 
    isLoading: isInsightsLoading 
  } = useGetPersonalizedInsightsQuery();

  const stats = dashboardData?.stats;
  const trends = trendsData?.trends;
  const insights = insightsData?.insights;

  if (isDashboardLoading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </motion.div>
          <span className="ml-3 text-lg text-gray-600">加载分析数据中...</span>
        </div>
      </div>
    );
  }

  if (dashboardError || !stats) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">数据加载失败</h3>
          <p className="text-red-600 mb-4">无法获取分析数据，请稍后重试。</p>
          <button
            onClick={() => refetchDashboard()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const tabConfig = [
    { id: 'overview', label: '总览', icon: BarChart3 },
    { id: 'trends', label: '趋势', icon: TrendingUp },
    { id: 'heatmap', label: '热力图', icon: Calendar },
    { id: 'insights', label: '洞察', icon: Brain },
    { id: 'achievements', label: '成就', icon: Award },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            学习分析中心
          </h1>
          <p className="text-gray-600 mt-1">深度了解你的学习表现和进度</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年</option>
          </select>
          
          <button
            onClick={() => refetchDashboard()}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="导出数据"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: '总学习时长',
            value: analyticsUtils.formatStudyTime(stats.studyTime.totalMinutes),
            change: '+12%',
            trend: 'up',
            icon: Clock,
            color: 'blue',
            subtitle: `今日: ${analyticsUtils.formatStudyTime(stats.studyTime.todayMinutes)}`,
          },
          {
            title: '平均准确率',
            value: analyticsUtils.formatAccuracy(stats.avgAccuracy),
            change: '+5.2%',
            trend: 'up',
            icon: Target,
            color: 'green',
            subtitle: `最近: ${analyticsUtils.formatAccuracy(stats.recentAccuracy)}`,
          },
          {
            title: '当前连击',
            value: `${stats.currentStreak}`,
            change: `最佳: ${stats.bestStreak}`,
            trend: stats.currentStreak > stats.bestStreak * 0.8 ? 'up' : 'down',
            icon: Zap,
            color: 'orange',
            subtitle: '连续答对次数',
          },
          {
            title: '掌握题目',
            value: `${stats.masteredQuestions}`,
            change: '+15',
            trend: 'up',
            icon: Award,
            color: 'purple',
            subtitle: `总计: ${stats.totalQuestions} 题`,
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${metric.color}-100`}>
                <metric.icon className={`h-6 w-6 text-${metric.color}-600`} />
              </div>
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' ? <ArrowUp className="h-4 w-4" /> :
                 metric.trend === 'down' ? <ArrowDown className="h-4 w-4" /> :
                 <Minus className="h-4 w-4" />}
                <span className="ml-1">{metric.change}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600">{metric.title}</div>
            {metric.subtitle && (
              <div className="text-xs text-gray-500 mt-2">{metric.subtitle}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
        <nav className="flex space-x-2">
          {tabConfig.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <SubjectPerformance />
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-8">
              <ReviewHeatmap />
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-8">
              <LearningTrends />
            </div>
          )}

          {/* Legacy trends implementation for fallback */}
          {activeTab === 'trends' && false && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Type Performance Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">题型表现</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.typePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="typeLabel" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">本周进度</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => analyticsUtils.formatDisplayDate(value)}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => analyticsUtils.formatDisplayDate(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Study Time Pattern */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">学习时间模式</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsUtils.formatStudyTime(stats.studyTime.todayMinutes)}
                    </div>
                    <div className="text-sm text-gray-500">今日</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsUtils.formatStudyTime(stats.studyTime.weekMinutes)}
                    </div>
                    <div className="text-sm text-gray-500">本周</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.studyTime.bestDay}
                    </div>
                    <div className="text-sm text-gray-500">最佳日</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(stats.studyTime.weekdayPattern).map(([day, data]) => (
                    <div key={day} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 text-sm text-gray-600">
                          {analyticsUtils.getWeekdayName(day)}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.minutes / Math.max(...Object.values(stats.studyTime.weekdayPattern).map(d => d.minutes))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-20 text-right">
                        {analyticsUtils.formatStudyTime(data.minutes)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  个性化建议
                </h3>
                <div className="space-y-4">
                  {stats.recommendations.slice(0, 3).map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-l-4 ${analyticsUtils.getRecommendationPriorityColor(rec.priority)}`}
                    >
                      <div className="font-medium text-gray-900 mb-1">{rec.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{rec.description}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority >= 4 ? 'bg-red-100 text-red-600' :
                          rec.priority >= 3 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {rec.priority >= 4 ? '高优先级' : 
                           rec.priority >= 3 ? '中优先级' : '低优先级'}
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          立即行动
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends-legacy' && trends && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">学习趋势分析</h3>
                {selectedPeriod === 'week' && trends.accuracy_trend && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trends.accuracy_trend.map((acc, index) => ({ 
                      day: `Day ${index + 1}`, 
                      accuracy: acc,
                      study_time: trends.study_time_trend?.[index] || 0,
                      questions: trends.questions_trend?.[index] || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" name="准确率%" />
                      <Line type="monotone" dataKey="study_time" stroke="#10B981" name="学习时间(分)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && insights && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Strengths and Weaknesses */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">优势与弱项</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-green-600 mb-3 flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        优势领域
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.strengths.map((strength, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-600 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        提升空间
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.areas_for_improvement.map((area, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Recommendations */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">学习建议</h3>
                  <div className="space-y-4">
                    {insights.learning_recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Motivation Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  激励小贴士
                </h3>
                <div className="space-y-3">
                  {insights.motivation_tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <p className="text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 border-2 transition-all ${
                      achievement.completed 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        analyticsUtils.getAchievementCategoryColor(achievement.category)
                      }`}>
                        {achievement.category}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{achievement.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">进度</span>
                        <span className="font-medium">
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            achievement.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${analyticsUtils.calculateProgressPercentage(achievement.progress, achievement.target)}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          XP奖励: {achievement.xpReward}
                        </span>
                        {achievement.completed && (
                          <span className="text-xs text-green-600 font-medium">✓ 已完成</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}