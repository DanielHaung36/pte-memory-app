'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetLearningTrendsQuery } from '@/lib/store/analyticsApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

interface LearningTrendsProps {
  className?: string;
}

const periodOptions = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' }
];

export default function LearningTrends({ className = '' }: LearningTrendsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { data: trendsData, isLoading, error } = useGetLearningTrendsQuery({ period: selectedPeriod });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 学习趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            ❌ 加载失败
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">无法加载学习趋势数据</p>
        </CardContent>
      </Card>
    );
  }

  const renderWeeklyTrends = () => {
    if (!trendsData?.trends?.accuracy_trend) return null;

    const weekData = trendsData.trends.accuracy_trend.map((accuracy, index) => ({
      day: `第${index + 1}天`,
      accuracy,
      studyTime: trendsData.trends.study_time_trend?.[index] || 0,
      questions: trendsData.trends.questions_trend?.[index] || 0,
      streak: trendsData.trends.streak_trend?.[index] || 0,
    }));

    return (
      <div className="space-y-6">
        {/* 准确率趋势 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">准确率趋势</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '准确率']}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 学习时间和题目数量 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">学习量趋势</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'studyTime') return [`${value}分钟`, '学习时间'];
                  if (name === 'questions') return [`${value}题`, '题目数量'];
                  return [value, name];
                }}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <Bar dataKey="studyTime" fill="#3b82f6" name="studyTime" />
              <Bar dataKey="questions" fill="#8b5cf6" name="questions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMonthlyTrends = () => {
    if (!trendsData?.trends?.daily_data) return null;

    const dailyData = trendsData.trends.daily_data.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      accuracy: Math.round(item.accuracy),
      reviews: item.total_reviews,
      correct: item.correct_reviews,
      sessions: item.sessions,
    }));

    return (
      <div className="space-y-6">
        {/* 每日准确率趋势 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">每日准确率趋势</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '准确率']}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#10b981" 
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 每日复习量 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">每日复习量</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'reviews') return [`${value}题`, '总复习'];
                  if (name === 'correct') return [`${value}题`, '答对'];
                  if (name === 'sessions') return [`${value}次`, '学习次数'];
                  return [value, name];
                }}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Bar dataKey="reviews" fill="#3b82f6" name="reviews" />
              <Bar dataKey="correct" fill="#10b981" name="correct" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderQuarterlyTrends = () => {
    if (!trendsData?.trends?.monthly_summary) return null;

    const monthlyData = trendsData.trends.monthly_summary.map((item: any) => ({
      month: item.month,
      accuracy: item.avg_accuracy,
      studyHours: item.total_study_hours,
      questions: item.total_questions,
      mastered: item.mastered_questions,
    }));

    return (
      <div className="space-y-6">
        {/* 月度表现概览 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">月度表现概览</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') return [`${value.toFixed(1)}%`, '平均准确率'];
                  if (name === 'studyHours') return [`${value}小时`, '学习时间'];
                  return [value, name];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#10b981" 
                strokeWidth={3}
                name="accuracy"
              />
              <Line 
                type="monotone" 
                dataKey="studyHours" 
                stroke="#3b82f6" 
                strokeWidth={3}
                yAxisId="right"
                name="studyHours"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 掌握进度 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">掌握进度</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'mastered') return [`${value}题`, '已掌握'];
                  if (name === 'questions') return [`${value}题`, '总题数'];
                  return [value, name];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="questions" 
                stackId="1"
                stroke="#e5e7eb" 
                fill="#e5e7eb"
                name="questions"
              />
              <Area 
                type="monotone" 
                dataKey="mastered" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981"
                name="mastered"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderYearlyTrends = () => {
    if (!trendsData?.trends?.quarterly_summary) return null;

    const quarterlyData = trendsData.trends.quarterly_summary.map((item: any) => ({
      quarter: item.quarter,
      accuracy: item.avg_accuracy,
      studyHours: item.total_study_hours,
      questions: item.total_questions,
      mastered: item.mastered_questions,
    }));

    return (
      <div className="space-y-6">
        {/* 年度概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {trendsData.trends.year_improvement?.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">年度提升</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {trendsData.trends.total_mastered}
            </div>
            <div className="text-sm text-gray-600">累计掌握</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(trendsData.trends.learning_consistency * 100)?.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">学习一致性</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {quarterlyData.reduce((sum, q) => sum + q.studyHours, 0)}
            </div>
            <div className="text-sm text-gray-600">总学习时长(h)</div>
          </div>
        </div>

        {/* 季度趋势 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">季度表现趋势</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') return [`${value.toFixed(1)}%`, '平均准确率'];
                  if (name === 'studyHours') return [`${value}小时`, '学习时间'];
                  if (name === 'mastered') return [`${value}题`, '掌握题数'];
                  return [value, name];
                }}
              />
              <Bar dataKey="accuracy" fill="#10b981" name="accuracy" />
              <Bar dataKey="mastered" fill="#3b82f6" name="mastered" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTrendsContent = () => {
    switch (selectedPeriod) {
      case 'week':
        return renderWeeklyTrends();
      case 'month':
        return renderMonthlyTrends();
      case 'quarter':
        return renderQuarterlyTrends();
      case 'year':
        return renderYearlyTrends();
      default:
        return renderMonthlyTrends();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📈 学习趋势
          </span>
          
          {/* 时期选择器 */}
          <div className="flex gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedPeriod === option.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderTrendsContent()}
      </CardContent>
    </Card>
  );
}