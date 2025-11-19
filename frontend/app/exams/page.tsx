'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Play,
  BarChart3,
  Zap,
  Award,
  ChevronRight,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetExamStatisticsQuery } from '@/lib/store/examApi'

const examTypes = [
  {
    id: 'pte',
    name: 'PTE Academic',
    description: '皮尔森英语考试 - 全面的学术英语能力测试',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    href: '/exams/pte',
    features: ['口语与写作', '阅读', '听力', '综合技能'],
  },
  {
    id: 'ielts',
    name: 'IELTS',
    description: '雅思考试 - 国际英语语言测试系统',
    icon: <Award className="w-8 h-8" />,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    href: '/exams/ielts',
    features: ['听力', '阅读', '写作', '口语'],
  },
]

const quickActions = [
  {
    title: '模拟考试',
    description: '完整的考试模拟体验',
    icon: <Trophy className="w-6 h-6" />,
    color: 'green',
    href: '/exams/mock-test',
  },
  {
    title: '考试统计',
    description: '查看您的练习数据和进步',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'orange',
    href: '/exams/statistics',
  },
  {
    title: '快速练习',
    description: '随机题目快速刷题',
    icon: <Zap className="w-6 h-6" />,
    color: 'yellow',
    href: '/questions',
  },
]

export default function ExamsPage() {
  const { data: stats } = useGetExamStatisticsQuery()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            考试练习中心
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            针对PTE和IELTS考试的专业练习平台，助您快速提升成绩
          </p>
        </motion.div>

        {/* Statistics Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总练习题数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats as any).total_questions || 0}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">正确率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats as any).accuracy ? `${(stats as any).accuracy.toFixed(1)}%` : '0%'}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">练习时长</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats as any).total_time ? `${Math.floor((stats as any).total_time / 60)}h` : '0h'}
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
                    {(stats as any).streak_days || 0} 天
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Exam Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {examTypes.map((exam, index) => (
            <motion.a
              key={exam.id}
              href={exam.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden"
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${exam.gradient} opacity-0 group-hover:opacity-10 transition`}
              />

              <div className="relative p-8">
                {/* Icon */}
                <div className={`inline-flex p-4 ${exam.bgColor} rounded-2xl mb-4`}>
                  <div className={exam.textColor}>{exam.icon}</div>
                </div>

                {/* Title & Description */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {exam.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{exam.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {exam.features.map((feature) => (
                    <span
                      key={feature}
                      className={`px-3 py-1 ${exam.bgColor} ${exam.textColor} rounded-full text-sm font-medium`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${exam.textColor}`}>开始练习</span>
                  <ChevronRight
                    className={`w-5 h-5 ${exam.textColor} transform group-hover:translate-x-1 transition`}
                  />
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">快捷入口</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 bg-${action.color}-100 dark:bg-${action.color}-900/30 rounded-lg`}
                  >
                    <div className={`text-${action.color}-500`}>{action.icon}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-500 transition">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Study Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/20 rounded-xl">
              <Target className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">学习建议</h3>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  每天坚持练习至少30分钟，保持学习连贯性
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  先从简单题型开始，逐步提升难度
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  定期进行模拟考试，检验学习成果
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  重视错题复习，针对性加强薄弱环节
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
