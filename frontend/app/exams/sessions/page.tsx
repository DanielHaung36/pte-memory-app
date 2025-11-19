'use client'

import { useState } from 'react'
import { useGetExamSessionsQuery } from '@/lib/store/examApi'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ExamSessionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, error } = useGetExamSessionsQuery({
    status: statusFilter,
    limit: 50,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">加载考试记录...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">加载失败，请稍后重试</p>
          </div>
        </div>
      </div>
    )
  }

  const sessions = data?.sessions || []

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      active: '进行中',
      paused: '已暂停',
      completed: '已完成',
      abandoned: '已放弃',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">考试记录</h1>
          <p className="text-gray-600">查看你的所有考试会话和成绩</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            进行中
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'paused'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            已暂停
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            已完成
          </button>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无考试记录</h3>
            <p className="text-gray-600 mb-6">开始你的第一次模拟考试吧！</p>
            <Link
              href="/exams/mock-test"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              开始模拟考试
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {session.exam_type} 模拟考试
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(session.started_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {session.is_completed && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-600">
                          {session.total_score.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">总分</div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">进度</span>
                      <span className="font-medium text-gray-900">
                        {session.current_question_index} / {session.total_questions}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(session.current_question_index / session.total_questions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">答题数</div>
                      <div className="text-lg font-bold text-gray-900">
                        {session.questions_answered}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">正确</div>
                      <div className="text-lg font-bold text-green-600">
                        {session.correct_answers}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">错误</div>
                      <div className="text-lg font-bold text-red-600">
                        {session.wrong_answers}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">用时</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatDuration(session.time_spent)}
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown (for completed exams) */}
                  {session.is_completed && session.score_breakdown && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">分项得分</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {session.score_breakdown.speaking.questions_count > 0 && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {session.score_breakdown.speaking.score.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">口语</div>
                          </div>
                        )}
                        {session.score_breakdown.writing.questions_count > 0 && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {session.score_breakdown.writing.score.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">写作</div>
                          </div>
                        )}
                        {session.score_breakdown.reading.questions_count > 0 && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {session.score_breakdown.reading.score.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">阅读</div>
                          </div>
                        )}
                        {session.score_breakdown.listening.questions_count > 0 && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {session.score_breakdown.listening.score.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">听力</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {session.status === 'completed' ? (
                      <Link
                        href={`/exams/sessions/${session.id}/report`}
                        className="flex-1 bg-indigo-600 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        查看详细报告
                      </Link>
                    ) : session.status === 'active' || session.status === 'paused' ? (
                      <Link
                        href={`/exams/mock-test?session=${session.id}`}
                        className="flex-1 bg-green-600 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        {session.status === 'paused' ? '继续考试' : '返回考试'}
                      </Link>
                    ) : null}
                    <Link
                      href={`/exams/sessions/${session.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
