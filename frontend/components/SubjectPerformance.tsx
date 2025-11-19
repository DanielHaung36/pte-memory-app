'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPerformanceComparisonQuery } from '@/lib/store/analyticsApi';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SubjectPerformanceProps {
  className?: string;
}

const comparisonOptions = [
  { value: 'type', label: '各科目表现' },
  { value: 'difficulty', label: '难度分析' }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SubjectPerformance({ className = '' }: SubjectPerformanceProps) {
  const [comparisonType, setComparisonType] = useState('type');
  const { data: performanceData, isLoading, error } = useGetPerformanceComparisonQuery({ type: comparisonType });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 表现分析
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
          <p className="text-gray-600">无法加载表现分析数据</p>
        </CardContent>
      </Card>
    );
  }

  const renderSubjectPerformance = () => {
    if (!performanceData?.data) return null;

    const subjects = Object.entries(performanceData.data).map(([key, value]: [string, any]) => ({
      subject: getSubjectName(key),
      accuracy: value.accuracy,
      totalQuestions: value.total_questions,
      correctAnswers: value.correct_answers,
      avgResponseTime: value.avg_response_time,
      rank: value.rank || 0
    }));

    // 排序按准确率
    subjects.sort((a, b) => b.accuracy - a.accuracy);

    // 雷达图数据
    const radarData = subjects.map(item => ({
      subject: item.subject,
      准确率: item.accuracy,
      题量: Math.min((item.totalQuestions / Math.max(...subjects.map(s => s.totalQuestions))) * 100, 100),
      效率: Math.max(100 - (item.avgResponseTime / Math.max(...subjects.map(s => s.avgResponseTime))) * 100, 0)
    }));

    // 饼图数据
    const pieData = subjects.map((item, index) => ({
      name: item.subject,
      value: item.totalQuestions,
      accuracy: item.accuracy
    }));

    return (
      <div className="space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subjects.map((subject, index) => (
            <div key={subject.subject} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 truncate">{subject.subject}</h4>
                <div className={`text-xs px-2 py-1 rounded-full ${getRankColor(subject.rank)}`}>
                  #{subject.rank}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">准确率</span>
                  <span className="font-semibold text-green-600">{subject.accuracy.toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">题目数</span>
                  <span className="font-semibold text-blue-600">{subject.totalQuestions}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">平均用时</span>
                  <span className="font-semibold text-purple-600">{subject.avgResponseTime?.toFixed(0)}s</span>
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${subject.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 雷达图 - 综合表现 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">综合表现雷达图</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar 
                  name="准确率" 
                  dataKey="准确率" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar 
                  name="题量" 
                  dataKey="题量" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar 
                  name="效率" 
                  dataKey="效率" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 饼图 - 题目分布 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">题目分布</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [
                  `${value}题 (准确率: ${props.payload.accuracy.toFixed(1)}%)`,
                  '题目数量'
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 详细对比柱状图 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">详细表现对比</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjects}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') return [`${value.toFixed(1)}%`, '准确率'];
                  if (name === 'totalQuestions') return [`${value}题`, '题目总数'];
                  if (name === 'correctAnswers') return [`${value}题`, '答对题数'];
                  return [value, name];
                }}
              />
              <Bar dataKey="accuracy" fill="#10b981" name="accuracy" />
              <Bar dataKey="totalQuestions" fill="#3b82f6" name="totalQuestions" />
              <Bar dataKey="correctAnswers" fill="#f59e0b" name="correctAnswers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDifficultyAnalysis = () => {
    if (!performanceData?.data) return null;

    const difficulties = Object.entries(performanceData.data).map(([key, value]: [string, any]) => ({
      difficulty: getDifficultyName(key),
      accuracy: value.accuracy,
      totalQuestions: value.total_questions,
      correctAnswers: value.correct_answers,
      level: key
    }));

    return (
      <div className="space-y-6">
        {/* 难度概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficulties.map((diff, index) => (
            <div key={diff.difficulty} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{diff.difficulty}</h4>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(diff.level)}`}>
                  {diff.level}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {diff.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">准确率</div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">总题数:</span>
                  <span className="font-semibold text-blue-600">{diff.totalQuestions}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">答对:</span>
                  <span className="font-semibold text-green-600">{diff.correctAnswers}</span>
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getDifficultyProgressColor(diff.level)}`}
                    style={{ width: `${diff.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 难度对比图表 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">难度表现对比</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficulties}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') return [`${value.toFixed(1)}%`, '准确率'];
                  if (name === 'totalQuestions') return [`${value}题`, '题目总数'];
                  if (name === 'correctAnswers') return [`${value}题`, '答对题数'];
                  return [value, name];
                }}
              />
              <Bar dataKey="accuracy" fill="#10b981" name="accuracy" />
              <Bar dataKey="totalQuestions" fill="#3b82f6" name="totalQuestions" />
              <Bar dataKey="correctAnswers" fill="#f59e0b" name="correctAnswers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const getSubjectName = (key: string): string => {
    const names: Record<string, string> = {
      'speaking': '口语',
      'writing': '写作', 
      'reading': '阅读',
      'listening': '听力'
    };
    return names[key] || key;
  };

  const getDifficultyName = (key: string): string => {
    const names: Record<string, string> = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return names[key] || key;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getDifficultyColor = (level: string): string => {
    const colors: Record<string, string> = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyProgressColor = (level: string): string => {
    const colors: Record<string, string> = {
      'easy': 'bg-gradient-to-r from-green-400 to-green-600',
      'medium': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      'hard': 'bg-gradient-to-r from-red-400 to-red-600'
    };
    return colors[level] || 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📊 各科目表现
          </span>
          
          {/* 分析类型选择器 */}
          <div className="flex gap-2">
            {comparisonOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setComparisonType(option.value)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  comparisonType === option.value
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
        {comparisonType === 'type' ? renderSubjectPerformance() : renderDifficultyAnalysis()}
      </CardContent>
    </Card>
  );
}