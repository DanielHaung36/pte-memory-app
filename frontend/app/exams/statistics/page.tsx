'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  Calendar,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetExamStatisticsQuery } from '@/lib/store/examApi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const timeRanges = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' },
  { value: 'all', label: '全部' },
]

const examTypeFilters = [
  { value: 'all', label: '全部考试' },
  { value: 'pte', label: 'PTE' },
  { value: 'ielts', label: 'IELTS' },
]

export default function ExamStatisticsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [examType, setExamType] = useState('all')

  const { data: stats, isLoading } = useGetExamStatisticsQuery() as { data: any; isLoading: boolean }

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80)
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    if (percentage >= 60)
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href="/exams"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回考试中心
          </a>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            考试统计
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            查看您的练习数据和学习进度
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                时间范围:
              </span>
              <div className="flex gap-2">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      timeRange === range.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                考试类型:
              </span>
              <div className="flex gap-2">
                {examTypeFilters.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setExamType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      examType === type.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">总练习题数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.total_questions || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Target className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">平均正确率</p>
                    <p
                      className={`text-2xl font-bold ${getScoreColor(
                        stats?.accuracy || 0,
                        100
                      )}`}
                    >
                      {stats?.accuracy ? `${stats.accuracy.toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">总练习时长</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.total_time ? `${Math.floor(stats.total_time / 60)}h` : '0h'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">连续练习</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.streak_days || 0} 天
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Performance by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                各题型表现
              </h2>

              {stats?.by_type && stats.by_type.length > 0 ? (
                <div className="space-y-4">
                  {stats.by_type.map((type: any, index: number) => (
                    <motion.div
                      key={type.question_type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {type.question_type || '未分类'}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBgColor(
                            type.accuracy || 0,
                            100
                          )}`}
                        >
                          {type.accuracy ? `${type.accuracy.toFixed(1)}%` : '0%'}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {type.total || 0} 题
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {type.correct || 0} 正确
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          {type.wrong || 0} 错误
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (type.accuracy || 0) >= 80
                              ? 'bg-green-500'
                              : (type.accuracy || 0) >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${type.accuracy || 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">暂无数据</p>
                </div>
              )}
            </motion.div>

            {/* Recent Tests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-500" />
                最近的模拟考试
              </h2>

              {stats?.recent_tests && stats.recent_tests.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_tests.map((test: any, index: number) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Trophy className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {test.exam_type === 'pte'
                                ? 'PTE Academic'
                                : test.exam_type === 'ielts_academic'
                                ? 'IELTS Academic'
                                : 'IELTS General'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDistanceToNow(new Date(test.completed_at), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-2xl font-bold ${getScoreColor(
                              test.score || 0,
                              test.exam_type === 'pte' ? 90 : 9
                            )}`}
                          >
                            {test.score || 0}
                            {test.exam_type === 'pte' ? '/90' : '/9'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {test.accuracy ? `${test.accuracy}%` : '0%'} 正确率
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {test.duration ? `${test.duration} 分钟` : '未记录'}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {test.questions_count || 0} 题
                        </span>
                        <a
                          href={`/exams/results/${test.id}`}
                          className="ml-auto text-blue-500 hover:text-blue-600"
                        >
                          查看详情 →
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    您还没有完成任何模拟考试
                  </p>
                  <a
                    href="/exams/mock-test"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    <Trophy className="w-4 h-4" />
                    开始模拟考试
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
