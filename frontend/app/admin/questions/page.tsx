'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, ArrowLeft, Loader2, CheckCircle, XCircle,
  AlertCircle, Eye, User, Calendar, Tag, Star, Mic, PenTool,
  Eye as EyeIcon, Headphones, ChevronDown, ChevronUp
} from 'lucide-react'
import Link from 'next/link'

const QUESTION_TYPES = {
  speaking: { label: '口语', icon: <Mic className="h-4 w-4" />, color: 'text-pink-600 bg-pink-100' },
  writing: { label: '写作', icon: <PenTool className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
  reading: { label: '阅读', icon: <EyeIcon className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
  listening: { label: '听力', icon: <Headphones className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchQuestions()
  }, [page])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/questions/pending?page=${page}&limit=20`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setTotalPages(data.pagination?.total_pages || 1)
      } else if (response.status === 403) {
        alert('权限不足')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (questionId: string, comment?: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/questions/${questionId}/approve`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: comment || '' }),
        }
      )

      if (response.ok) {
        alert('题目已批准')
        fetchQuestions()
      } else {
        const data = await response.json()
        alert(data.error || '批准失败')
      }
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('批准失败')
    }
  }

  const handleReject = async (questionId: string, reason: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/questions/${questionId}/reject`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      )

      if (response.ok) {
        alert('题目已拒绝')
        fetchQuestions()
      } else {
        const data = await response.json()
        alert(data.error || '拒绝失败')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
      alert('拒绝失败')
    }
  }

  const handleBatchReview = async (action: 'approve' | 'reject') => {
    if (selectedQuestions.length === 0) {
      alert('请先选择题目')
      return
    }

    let comment = ''
    if (action === 'reject') {
      comment = prompt('请输入拒绝原因：') || ''
      if (!comment) return
    }

    try {
      const response = await fetch(
        'http://localhost:8080/api/admin/questions/batch-review',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_ids: selectedQuestions,
            action,
            comment,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        alert(`批量${action === 'approve' ? '批准' : '拒绝'}成功，处理了 ${data.count} 个题目`)
        setSelectedQuestions([])
        fetchQuestions()
      } else {
        const data = await response.json()
        alert(data.error || '批量操作失败')
      }
    } catch (error) {
      console.error('Batch review failed:', error)
      alert('批量操作失败')
    }
  }

  const toggleSelection = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(questions.map(q => q.id))
    }
  }

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < level ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
              </Link>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  题目审核
                </h1>
                <p className="text-gray-600 mt-1">审核用户提交的题目</p>
              </div>
            </div>

            {/* Batch Actions */}
            {selectedQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm text-gray-600">
                  已选择 {selectedQuestions.length} 个题目
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBatchReview('approve')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  批量批准
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBatchReview('reject')}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  批量拒绝
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Select All */}
        {questions.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedQuestions.length === questions.length}
                onChange={selectAll}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">全选</span>
            </label>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-100 text-center"
          >
            <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无待审核题目
            </h3>
            <p className="text-gray-600">所有题目都已审核完毕</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id)
              const isSelected = selectedQuestions.includes(question.id)

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all ${
                    isSelected ? 'border-orange-400' : 'border-gray-100'
                  } hover:shadow-xl`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(question.id)}
                      className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      {/* Question Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.color ||
                                'text-gray-600 bg-gray-100'
                              }`}
                            >
                              {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.icon}
                              <span className="ml-1">
                                {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.label ||
                                  question.question_type}
                              </span>
                            </span>

                            <div className="flex items-center">
                              {getDifficultyStars(question.difficulty_level)}
                            </div>

                            {question.tags && question.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {question.tags.slice(0, 3).map((tag: string, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {question.title}
                          </h3>

                          <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {question.content}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>
                                {question.User?.username || '匿名用户'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(question.created_at)}</span>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200 space-y-3"
                              >
                                {question.correct_answer && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      正确答案：
                                    </p>
                                    <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                      {question.correct_answer}
                                    </p>
                                  </div>
                                )}

                                {question.explanation && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      解析：
                                    </p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                      {question.explanation}
                                    </p>
                                  </div>
                                )}

                                {question.audio_url && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      音频：
                                    </p>
                                    <audio controls className="w-full">
                                      <source src={question.audio_url} />
                                    </audio>
                                  </div>
                                )}

                                {question.image_url && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      图片：
                                    </p>
                                    <img
                                      src={question.image_url}
                                      alt="Question"
                                      className="max-w-md rounded-lg"
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Expand/Collapse Button */}
                          <button
                            onClick={() => toggleExpand(question.id)}
                            className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                收起详情
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                展开详情
                              </>
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleApprove(question.id)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            批准
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const reason = prompt('请输入拒绝原因：')
                              if (reason) handleReject(question.id, reason)
                            }}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            拒绝
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
