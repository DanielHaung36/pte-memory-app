'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Download,
  Star,
  Users,
  Clock,
  Globe,
  Lock,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  FileText,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import {
  useGetLibraryDetailQuery,
  useDownloadLibraryMutation,
  useRateLibraryMutation,
} from '@/lib/store/libraryApi'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export default function LibraryDetailPage() {
  const params = useParams()
  const libraryId = params.id as string

  const { data, isLoading, isError } = useGetLibraryDetailQuery(libraryId)
  const [downloadLibrary, { isLoading: isDownloading }] = useDownloadLibraryMutation()
  const [rateLibrary] = useRateLibraryMutation()

  const [userRating, setUserRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  const library = data?.library

  const handleDownload = async () => {
    if (!library) return
    try {
      await downloadLibrary(libraryId).unwrap()
      alert(`已下载题库: ${library.name}`)
    } catch (error) {
      console.error('下载题库失败:', error)
      alert('下载失败，请重试')
    }
  }

  const handleRate = async (rating: number) => {
    try {
      await rateLibrary({ libraryId, rating }).unwrap()
      setUserRating(rating)
    } catch (error) {
      console.error('评分失败:', error)
    }
  }

  const getQuestionTypeIcon = (type: string) => {
    if (type.includes('audio') || type.includes('listening')) {
      return <Volume2 className="w-4 h-4" />
    } else if (type.includes('reading') || type.includes('text')) {
      return <FileText className="w-4 h-4" />
    } else if (type.includes('image')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <BookOpen className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <AppNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !library) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <AppNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">题库不存在或已被删除</p>
            <a
              href="/library"
              className="mt-4 inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              返回题库列表
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <a
            href="/library"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回题库列表
          </a>
        </motion.div>

        {/* Library Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {library.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {library.privacy === 'public' ? (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <Globe className="w-4 h-4" />
                        公开
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Lock className="w-4 h-4" />
                        私密
                      </span>
                    )}
                    {library.category && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                        {library.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {library.description || '暂无描述'}
              </p>

              {/* Creator Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  创建者: {library.creator?.username || '匿名用户'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDistanceToNow(new Date(library.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isDownloading ? '下载中...' : '下载题库'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">题目数量</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {library.question_count || 0}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">下载次数</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {library.download_count || 0}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">浏览次数</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {library.view_count || 0}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">平均评分</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {library.rating ? library.rating.toFixed(1) : '0.0'}
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">为这个题库评分:</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 cursor-pointer transition ${
                    star <= (hoveredStar || userRating || library.rating || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => handleRate(star)}
                />
              ))}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                ({library.rating_count || 0} 个评分)
              </span>
            </div>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            题目列表
          </h2>

          {library.questions && library.questions.length > 0 ? (
            <div className="space-y-3">
              {library.questions.map((question: any, index: number) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {question.content}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 ml-11">
                        {question.question_type && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">
                            {getQuestionTypeIcon(question.question_type)}
                            {question.question_type}
                          </span>
                        )}
                        {question.difficulty && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              difficultyColors[question.difficulty] || difficultyColors.medium
                            }`}
                          >
                            {difficultyLabels[question.difficulty] || question.difficulty}
                          </span>
                        )}
                        {question.audio_url && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Volume2 className="w-3 h-3" />
                            有音频
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`/questions/${question.id}`}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1 text-sm"
                    >
                      <Play className="w-3 h-3" />
                      练习
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">该题库暂无题目</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
