'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  Headphones,
  FileText,
  PenTool,
  Mic,
  Play,
  Filter,
  Clock,
  Target,
  CheckCircle,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetIELTSPracticeQuery, useLikeQuestionMutation } from '@/lib/store/examApi'

const ieltsModules = [
  {
    type: 'listening',
    name: '听力',
    icon: <Headphones className="w-6 h-6" />,
    color: 'blue',
    tasks: [
      { value: 'section1', label: 'Section 1', description: '日常生活对话' },
      { value: 'section2', label: 'Section 2', description: '生活场景独白' },
      { value: 'section3', label: 'Section 3', description: '学术讨论' },
      { value: 'section4', label: 'Section 4', description: '学术讲座' },
    ],
  },
  {
    type: 'reading',
    name: '阅读',
    icon: <FileText className="w-6 h-6" />,
    color: 'green',
    tasks: [
      { value: 'passage1', label: 'Passage 1', description: '基础阅读理解' },
      { value: 'passage2', label: 'Passage 2', description: '中级阅读理解' },
      { value: 'passage3', label: 'Passage 3', description: '高级阅读理解' },
    ],
  },
  {
    type: 'writing',
    name: '写作',
    icon: <PenTool className="w-6 h-6" />,
    color: 'purple',
    tasks: [
      { value: 'task1', label: 'Task 1', description: '图表描述/书信写作' },
      { value: 'task2', label: 'Task 2', description: '议论文写作' },
    ],
  },
  {
    type: 'speaking',
    name: '口语',
    icon: <Mic className="w-6 h-6" />,
    color: 'orange',
    tasks: [
      { value: 'part1', label: 'Part 1', description: '个人信息与日常话题' },
      { value: 'part2', label: 'Part 2', description: '个人陈述' },
      { value: 'part3', label: 'Part 3', description: '深入讨论' },
    ],
  },
]

const testModules = [
  { value: 'academic', label: '学术类 (Academic)' },
  { value: 'general', label: '培训类 (General Training)' },
]

export default function IELTSPracticePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState<string>('academic')
  const [limit] = useState(10)

  const { data, isLoading, refetch } = useGetIELTSPracticeQuery(
    {
      type: selectedType || undefined,
      task: selectedTask || undefined,
      module: selectedModule,
      limit,
    },
    { skip: !selectedType }
  )

  const [likeQuestion] = useLikeQuestionMutation()

  const questions = data?.questions || []
  const selectedModuleData = ieltsModules.find((m) => m.type === selectedType)

  const getModuleColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-500',
      green:
        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-500',
      purple:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-500',
      orange:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-500',
    }
    return colors[color] || colors.blue
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
            <Award className="w-8 h-8 text-purple-500" />
            IELTS 雅思练习
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            选择模块和任务开始练习，全面提升雅思成绩
          </p>
        </motion.div>

        {/* Test Module Selection */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              考试类型:
            </span>
            <div className="flex gap-2">
              {testModules.map((module) => (
                <button
                  key={module.value}
                  onClick={() => setSelectedModule(module.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedModule === module.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {module.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Modules Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {ieltsModules.map((module, index) => (
            <motion.button
              key={module.type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => {
                setSelectedType(module.type)
                setSelectedTask(null)
              }}
              className={`p-6 rounded-xl border-2 transition ${
                selectedType === module.type
                  ? `${getModuleColor(module.color)}`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div
                  className={`inline-flex p-4 rounded-xl mb-3 ${
                    selectedType === module.type
                      ? getModuleColor(module.color)
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {module.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{module.name}</h3>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Tasks Selection */}
        {selectedType && selectedModuleData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              选择部分
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedModuleData.tasks.map((task, index) => (
                <motion.button
                  key={task.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedTask(task.value)}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    selectedTask === task.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {task.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {task.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Questions List */}
        {selectedType && selectedTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                练习题目 ({questions.length})
              </h2>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                刷新题目
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  暂无该部分的练习题，请选择其他部分
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-bold">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {question.content}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 ml-11">
                          {question.difficulty && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                question.difficulty === 'easy'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : question.difficulty === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}
                            >
                              Band{' '}
                              {question.difficulty === 'easy'
                                ? '5-6'
                                : question.difficulty === 'medium'
                                ? '6-7'
                                : '7-9'}
                            </span>
                          )}
                          {question.time_limit && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {question.time_limit}分钟
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={`/questions/${question.id}`}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        开始练习
                      </a>
                    </div>

                    {/* Question Stats */}
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4" />
                        {question.accuracy ? `${question.accuracy}%` : '暂无'} 正确率
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        {question.attempt_count || 0} 次尝试
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!selectedType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              选择模块开始练习
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              从上方选择一个模块（听力/阅读/写作/口语），开始您的雅思练习
            </p>
          </motion.div>
        )}

        {selectedType && !selectedTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              选择部分
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              请从上方选择一个具体的部分开始练习
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
