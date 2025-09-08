'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppNavigation from '@/components/ui/navigation/AppNavigation';
import { useGetQuestionStatisticsQuery, useGetReviewHistoryQuery } from '@/lib/store/questionsApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Brain,
  Zap,
  Award,
  ChevronDown,
  Filter,
  Download,
  Eye,
  Heart,
  Sparkles
} from 'lucide-react';

// 导出报告功能
const exportReport = (data: any, filename: string) => {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 遗忘曲线数据
const forgettingCurveData = [
  { time: '1小时', retention: 90, optimal: 95 },
  { time: '1天', retention: 70, optimal: 85 },
  { time: '3天', retention: 45, optimal: 75 },
  { time: '1周', retention: 35, optimal: 65 },
  { time: '2周', retention: 25, optimal: 55 },
  { time: '1月', retention: 20, optimal: 45 },
  { time: '3月', retention: 15, optimal: 35 }
];

const subjectData = [
  { subject: '听力', completed: 45, total: 60, accuracy: 78 },
  { subject: '口语', completed: 32, total: 50, accuracy: 85 },
  { subject: '阅读', completed: 38, total: 55, accuracy: 72 },
  { subject: '写作', completed: 28, total: 45, accuracy: 88 }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('questions');

  // 使用真实API数据
  const { data: statisticsData, isLoading: statisticsLoading } = useGetQuestionStatisticsQuery();
  const { data: reviewHistoryData, isLoading: historyLoading } = useGetReviewHistoryQuery({ 
    days: timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90 
  });

  const isLoading = statisticsLoading || historyLoading;
  const statistics = statisticsData?.statistics;
  const reviewHistory = reviewHistoryData?.reviews || [];

  const totalStats = {
    totalQuestions: statistics?.total_questions || 0,
    avgAccuracy: Math.round(statistics?.average_accuracy || 0),
    totalStudyTime: Math.round((reviewHistory.reduce((sum, day) => sum + day.time_spent, 0) / 3600) || 0), // 小时
    currentStreak: reviewHistory.filter(day => day.streak_day).length || 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
            />
            <p className="text-lg font-medium text-gray-700">正在分析学习数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-6 h-6 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full opacity-60 blur-sm"
        />
      </div>

      <AppNavigation />

      {/* 页面标题 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg"
              >
                <BarChart3 className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  学习分析
                </motion.h1>
                <motion.p 
                  className="text-gray-600 mt-2 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Heart className="w-4 h-4 text-pink-500 mr-2" />
                  深度洞察学习表现，科学优化学习路径
                  <Sparkles className="w-4 h-4 text-yellow-500 ml-2" />
                </motion.p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="7days">过去7天</option>
                <option value="30days">过去30天</option>
                <option value="90days">过去90天</option>
              </select>
              
              <motion.button
                onClick={() => exportReport({ statistics, reviewHistory, totalStats }, 'learning-analytics-report')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <Download className="h-4 w-4 mr-2 inline" />
                导出报告
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 关键指标统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总答题数</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {totalStats.totalQuestions}
                </p>
                <p className="text-xs text-green-600 mt-1">↗ +12% 较上月</p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl"
                whileHover={{ rotate: 10 }}
              >
                <Target className="h-6 w-6 text-blue-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">平均准确率</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {totalStats.avgAccuracy}%
                </p>
                <p className="text-xs text-green-600 mt-1">↗ +5% 较上月</p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl"
                whileHover={{ rotate: -10 }}
              >
                <TrendingUp className="h-6 w-6 text-green-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">学习时长</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {totalStats.totalStudyTime}h
                </p>
                <p className="text-xs text-orange-600 mt-1">本月累计</p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl"
                whileHover={{ rotate: 5 }}
              >
                <Clock className="h-6 w-6 text-orange-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">连续学习</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {totalStats.currentStreak}天
                </p>
                <p className="text-xs text-purple-600 mt-1">坚持就是胜利！</p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl"
                whileHover={{ rotate: -5 }}
              >
                <Zap className="h-6 w-6 text-purple-600" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 学习趋势图 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                  学习趋势
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedMetric('questions')}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      selectedMetric === 'questions'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    答题量
                  </button>
                  <button
                    onClick={() => setSelectedMetric('accuracy')}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      selectedMetric === 'accuracy'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    准确率
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-64 relative">
                {/* 真实数据图表 */}
                <ResponsiveContainer width="100%" height="100%">
                  {selectedMetric === 'questions' ? (
                    <BarChart data={reviewHistory.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value: any) => [`${value} 题`, '复习数量']}
                        labelFormatter={(label) => `日期: ${new Date(label).toLocaleDateString('zh-CN')}`}
                      />
                      <Bar dataKey="review_count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  ) : (
                    <LineChart data={reviewHistory.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        fontSize={12}
                      />
                      <YAxis domain={[0, 100]} fontSize={12} />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(1)}%`, '准确率']}
                        labelFormatter={(label) => `日期: ${new Date(label).toLocaleDateString('zh-CN')}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy_rate" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6, fill: '#059669' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* 遗忘曲线 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Brain className="h-5 w-5 text-purple-500 mr-2" />
                遗忘曲线分析
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                科学复习时机，最大化记忆效果
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {forgettingCurveData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {item.time}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="flex items-center space-x-2">
                          {/* 当前记忆率 */}
                          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.retention}%` }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                              className="bg-gradient-to-r from-red-400 to-orange-500 h-2 rounded-full"
                            />
                          </div>
                          {/* 最佳复习时机 */}
                          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.optimal}%` }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                              className="bg-gradient-to-r from-green-400 to-teal-500 h-2 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 space-x-4">
                        <span className="text-orange-600">{item.retention}%</span>
                        <span className="text-green-600">{item.optimal}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 flex items-center justify-center space-x-6 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-2 bg-gradient-to-r from-red-400 to-orange-500 rounded mr-2"></div>
                  <span className="text-gray-600">当前记忆率</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-2 bg-gradient-to-r from-green-400 to-teal-500 rounded mr-2"></div>
                  <span className="text-gray-600">最佳复习时机</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 学科分析 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Award className="h-5 w-5 text-yellow-500 mr-2" />
              学科表现分析
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subjectData.map((subject, index) => (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                    <span className="text-sm text-gray-500">
                      {subject.completed}/{subject.total}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>完成进度</span>
                      <span>{Math.round((subject.completed / subject.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(subject.completed / subject.total) * 100}%` }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">准确率</span>
                    <span className={`font-semibold ${
                      subject.accuracy >= 80 ? 'text-green-600' : 
                      subject.accuracy >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {subject.accuracy}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}