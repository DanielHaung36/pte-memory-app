'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Save,
  Globe,
  Lock,
  Plus,
  X,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useCreateLibraryMutation } from '@/lib/store/libraryApi'
import { useGetQuestionsQuery } from '@/lib/store/questionsApi'
import { useRouter } from 'next/navigation'

const categories = [
  { value: 'pte', label: 'PTE' },
  { value: 'ielts', label: 'IELTS' },
  { value: 'vocabulary', label: '词汇' },
  { value: 'grammar', label: '语法' },
  { value: 'listening', label: '听力' },
  { value: 'reading', label: '阅读' },
  { value: 'writing', label: '写作' },
  { value: 'speaking', label: '口语' },
]

export default function CreateLibraryPage() {
  const router = useRouter()
  const [createLibrary, { isLoading, isSuccess, isError, error }] = useCreateLibraryMutation()
  const { data: questionsData } = useGetQuestionsQuery({ limit: 100 })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'pte',
    privacy: 'public',
    question_ids: [] as string[],
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showQuestionSelector, setShowQuestionSelector] = useState(false)

  const questions = questionsData?.questions || []
  const filteredQuestions = questions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedQuestions = questions.filter((q) => formData.question_ids.includes(q.id))

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleQuestion = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      question_ids: prev.question_ids.includes(questionId)
        ? prev.question_ids.filter((id) => id !== questionId)
        : [...prev.question_ids, questionId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('请输入题库名称')
      return
    }

    if (formData.question_ids.length === 0) {
      alert('请至少选择一个题目')
      return
    }

    try {
      const result = await createLibrary(formData).unwrap()
      alert('题库创建成功！')
      router.push(`/library/${result.library.id}`)
    } catch (err) {
      console.error('创建题库失败:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href="/library"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回题库列表
          </a>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            创建题库
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            创建自己的题库，分享给其他学习者
          </p>
        </motion.div>

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300 font-medium">题库创建成功！</span>
          </motion.div>
        )}

        {/* Error Message */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 font-medium">
              创建失败，请重试
            </span>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6"
        >
          {/* Library Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题库名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如: PTE核心词汇1000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题库描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="简单介绍一下这个题库的内容和用途..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分类
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              隐私设置
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleChange('privacy', 'public')}
                className={`flex-1 p-4 border-2 rounded-lg transition ${
                  formData.privacy === 'public'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Globe
                    className={`w-5 h-5 ${
                      formData.privacy === 'public' ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      formData.privacy === 'public'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    公开
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  所有人都可以看到和下载
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleChange('privacy', 'private')}
                className={`flex-1 p-4 border-2 rounded-lg transition ${
                  formData.privacy === 'private'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock
                    className={`w-5 h-5 ${
                      formData.privacy === 'private' ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      formData.privacy === 'private'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    私密
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">仅自己可见</p>
              </button>
            </div>
          </div>

          {/* Question Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              选择题目 <span className="text-red-500">*</span>
            </label>

            {/* Selected Questions */}
            {selectedQuestions.length > 0 && (
              <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                  已选择 {selectedQuestions.length} 个题目
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestions.map((q) => (
                    <span
                      key={q.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm"
                    >
                      <span className="text-gray-900 dark:text-white truncate max-w-[200px]">
                        {q.content}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleQuestion(q.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Question Selector */}
            <button
              type="button"
              onClick={() => setShowQuestionSelector(!showQuestionSelector)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {showQuestionSelector ? '隐藏题目选择器' : '添加题目'}
            </button>

            {/* Question Selector */}
            {showQuestionSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索题目..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Question List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredQuestions.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                      暂无题目
                    </p>
                  ) : (
                    filteredQuestions.map((question) => (
                      <label
                        key={question.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                          formData.question_ids.includes(question.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.question_ids.includes(question.id)}
                          onChange={() => handleToggleQuestion(question.id)}
                          className="mt-1 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {question.content}
                          </p>
                          {question.question_type && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {question.question_type}
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isLoading ? '创建中...' : '创建题库'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
