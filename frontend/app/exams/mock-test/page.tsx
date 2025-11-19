'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Clock,
  BookOpen,
  Play,
  Settings,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useStartMockTestMutation } from '@/lib/store/examApi'
import { useRouter } from 'next/navigation'

const examTypes = [
  {
    id: 'pte',
    name: 'PTE Academic',
    description: '完整的PTE学术英语考试模拟',
    duration: 180,
    sections: ['口语与写作', '阅读', '听力'],
    questionCount: 52,
    color: 'blue',
  },
  {
    id: 'ielts_academic',
    name: 'IELTS Academic',
    description: '雅思学术类考试模拟',
    duration: 165,
    sections: ['听力', '阅读', '写作', '口语'],
    questionCount: 40,
    color: 'purple',
  },
  {
    id: 'ielts_general',
    name: 'IELTS General Training',
    description: '雅思培训类考试模拟',
    duration: 165,
    sections: ['听力', '阅读', '写作', '口语'],
    questionCount: 40,
    color: 'green',
  },
]

const mockTestFeatures = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: '真实计时',
    description: '严格按照考试时间限制',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: '完整题型',
    description: '覆盖所有考试题型',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: '智能评分',
    description: '自动计算预估分数',
  },
  {
    icon: <Award className="w-5 h-5" />,
    title: '详细报告',
    description: '考后提供完整分析报告',
  },
]

export default function MockTestPage() {
  const router = useRouter()
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    enableTimer: true,
    enablePause: false,
    shuffleQuestions: true,
    showFeedback: false,
  })

  const [startMockTest, { isLoading, isError, error }] = useStartMockTestMutation()

  const selectedExamData = examTypes.find((exam) => exam.id === selectedExam)

  const handleStartTest = async () => {
    if (!selectedExam) {
      alert('请选择考试类型')
      return
    }

    try {
      const result = await startMockTest({
        exam_type: selectedExam as any,
      }).unwrap()

      // Navigate to test session
      router.push(`/exams/mock-test/session/${result.test_id}`)
    } catch (err) {
      console.error('启动模拟考试失败:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Trophy className="w-8 h-8 text-yellow-500" />
            模拟考试
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            完整的考试模拟体验，帮助您熟悉考试流程和时间管理
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {mockTestFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Exam Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            选择考试类型
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {examTypes.map((exam, index) => (
              <motion.button
                key={exam.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => setSelectedExam(exam.id)}
                className={`p-6 rounded-2xl border-2 transition text-left ${
                  selectedExam === exam.id
                    ? `border-${exam.color}-500 bg-${exam.color}-50 dark:bg-${exam.color}-900/20`
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${
                      selectedExam === exam.id
                        ? `bg-${exam.color}-100 dark:bg-${exam.color}-900/30 text-${exam.color}-600 dark:text-${exam.color}-400`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Trophy className="w-6 h-6" />
                  </div>
                  {selectedExam === exam.id && (
                    <CheckCircle className={`w-6 h-6 text-${exam.color}-500`} />
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {exam.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {exam.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{exam.duration} 分钟</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>约 {exam.questionCount} 道题</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {exam.sections.map((section) => (
                    <span
                      key={section}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedExam === exam.id
                          ? `bg-${exam.color}-100 dark:bg-${exam.color}-900/30 text-${exam.color}-600 dark:text-${exam.color}-400`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Test Settings */}
        {selectedExam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-500" />
                考试设置
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {showSettings ? '收起' : '展开'}
              </button>
            </div>

            {showSettings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">启用计时器</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      严格按照考试时间限制
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, enableTimer: !prev.enableTimer }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableTimer ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableTimer ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">允许暂停</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      可以暂停考试（不推荐）
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, enablePause: !prev.enablePause }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enablePause ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enablePause ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">随机题目顺序</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      打乱题目出现顺序
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        shuffleQuestions: !prev.shuffleQuestions,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.shuffleQuestions ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">即时反馈</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      答题后立即显示正确答案（练习模式）
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, showFeedback: !prev.showFeedback }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showFeedback ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showFeedback ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Test Info & Start Button */}
        {selectedExam && selectedExamData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">准备开始模拟考试</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-white/90">
                      本次考试时长约 {selectedExamData.duration} 分钟，包含{' '}
                      {selectedExamData.questionCount} 道题目
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-white/90">
                      请确保在安静的环境中进行，并准备好耳机和麦克风
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-white/90">
                      考试开始后将无法返回，请做好充分准备
                    </p>
                  </div>
                </div>

                {isError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-300 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">启动考试失败，请重试</span>
                  </div>
                )}

                <button
                  onClick={handleStartTest}
                  disabled={isLoading}
                  className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                  {isLoading ? '启动中...' : '开始考试'}
                </button>
              </div>

              <div className="hidden md:block">
                <Trophy className="w-24 h-24 opacity-20" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedExam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-md"
          >
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              选择考试类型开始
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              请从上方选择一个考试类型，开始您的模拟考试
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
