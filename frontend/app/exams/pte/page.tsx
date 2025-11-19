'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Mic,
  FileText,
  Headphones,
  PenTool,
  Play,
  Filter,
  Clock,
  Target,
  CheckCircle,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetPTEPracticeQuery, useLikeQuestionMutation } from '@/lib/store/examApi'

const pteTypes = [
  {
    type: 'speaking',
    subtype: 'read_aloud',
    name: '朗读',
    icon: <Mic className="w-5 h-5" />,
    color: 'blue',
    description: '阅读屏幕上的文本并大声朗读',
  },
  {
    type: 'speaking',
    subtype: 'repeat_sentence',
    name: '复述句子',
    icon: <Mic className="w-5 h-5" />,
    color: 'blue',
    description: '听一遍句子后准确复述',
  },
  {
    type: 'speaking',
    subtype: 'describe_image',
    name: '描述图像',
    icon: <Mic className="w-5 h-5" />,
    color: 'blue',
    description: '详细描述屏幕上显示的图像',
  },
  {
    type: 'writing',
    subtype: 'summarize_text',
    name: '文本摘要',
    icon: <PenTool className="w-5 h-5" />,
    color: 'green',
    description: '用一句话概括文章主要内容',
  },
  {
    type: 'writing',
    subtype: 'essay',
    name: '议论文写作',
    icon: <PenTool className="w-5 h-5" />,
    color: 'green',
    description: '针对给定话题写一篇议论文',
  },
  {
    type: 'reading',
    subtype: 'multiple_choice',
    name: '多项选择',
    icon: <FileText className="w-5 h-5" />,
    color: 'purple',
    description: '从多个选项中选择正确答案',
  },
  {
    type: 'reading',
    subtype: 'reorder',
    name: '段落排序',
    icon: <FileText className="w-5 h-5" />,
    color: 'purple',
    description: '将打乱的段落按正确顺序排列',
  },
  {
    type: 'listening',
    subtype: 'summarize_spoken',
    name: '听力摘要',
    icon: <Headphones className="w-5 h-5" />,
    color: 'orange',
    description: '听一段音频后写出摘要',
  },
  {
    type: 'listening',
    subtype: 'fill_blanks',
    name: '填空',
    icon: <Headphones className="w-5 h-5" />,
    color: 'orange',
    description: '在听力过程中填写缺失的单词',
  },
]

const difficultyLevels = [
  { value: 'all', label: '全部难度' },
  { value: 'easy', label: '简单', color: 'green' },
  { value: 'medium', label: '中等', color: 'yellow' },
  { value: 'hard', label: '困难', color: 'red' },
]

export default function PTEPracticePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string>('all')
  const [limit] = useState(10)

  const { data, isLoading, refetch } = useGetPTEPracticeQuery(
    {
      type: selectedType || undefined,
      subtype: selectedSubtype || undefined,
      limit,
    },
    { skip: !selectedType && !selectedSubtype }
  )

  const [likeQuestion] = useLikeQuestionMutation()

  const questions = data?.questions || []

  const handleSelectType = (type: string, subtype: string) => {
    setSelectedType(type)
    setSelectedSubtype(subtype)
  }

  const handleLike = async (questionId: string) => {
    try {
      await likeQuestion(questionId).unwrap()
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const getTypeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
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
            <BookOpen className="w-8 h-8 text-blue-500" />
            PTE Academic 练习
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            选择题型开始练习，提升您的PTE考试成绩
          </p>
        </motion.div>

        {/* Question Types Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            选择题型
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pteTypes.map((item, index) => (
              <motion.button
                key={`${item.type}-${item.subtype}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleSelectType(item.type, item.subtype)}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  selectedType === item.type && selectedSubtype === item.subtype
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.color)}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Difficulty Filter */}
        {(selectedType || selectedSubtype) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6"
          >
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                难度:
              </span>
              <div className="flex gap-2">
                {difficultyLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      difficulty === level.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Questions List */}
        {(selectedType || selectedSubtype) && (
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                刷新题目
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  暂无该题型的练习题，请选择其他题型
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
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
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
                              {question.difficulty === 'easy'
                                ? '简单'
                                : question.difficulty === 'medium'
                                ? '中等'
                                : '困难'}
                            </span>
                          )}
                          {question.time_limit && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {question.time_limit}秒
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={`/questions/${question.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
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
        {!selectedType && !selectedSubtype && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              选择题型开始练习
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              从上方选择一个题型，我们将为您提供相应的练习题目
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
