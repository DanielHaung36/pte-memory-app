'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library,
  Search,
  Filter,
  BookOpen,
  Download,
  Star,
  Users,
  TrendingUp,
  Clock,
  Globe,
  Lock,
  Eye,
  Plus,
  ChevronDown,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import {
  useGetPublicLibrariesQuery,
  useDownloadLibraryMutation,
  useRateLibraryMutation,
} from '@/lib/store/libraryApi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const categories = [
  { value: 'all', label: '全部分类', icon: <Globe className="w-4 h-4" /> },
  { value: 'pte', label: 'PTE', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'ielts', label: 'IELTS', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'vocabulary', label: '词汇', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'grammar', label: '语法', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'listening', label: '听力', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'reading', label: '阅读', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'writing', label: '写作', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'speaking', label: '口语', icon: <BookOpen className="w-4 h-4" /> },
]

const sortOptions = [
  { value: 'latest', label: '最新发布', icon: <Clock className="w-4 h-4" /> },
  { value: 'popular', label: '最多下载', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'rating', label: '最高评分', icon: <Star className="w-4 h-4" /> },
]

export default function LibraryPage() {
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isFetching } = useGetPublicLibrariesQuery({
    category: category === 'all' ? undefined : category,
    limit,
    offset,
  })

  const [downloadLibrary] = useDownloadLibraryMutation()
  const [rateLibrary] = useRateLibraryMutation()

  const libraries = data?.libraries || []

  const handleDownload = async (libraryId: string, libraryName: string) => {
    try {
      await downloadLibrary(libraryId).unwrap()
      alert(`已下载题库: ${libraryName}`)
    } catch (error) {
      console.error('下载题库失败:', error)
      alert('下载失败，请重试')
    }
  }

  const handleRate = async (libraryId: string, rating: number) => {
    try {
      await rateLibrary({ libraryId, rating }).unwrap()
    } catch (error) {
      console.error('评分失败:', error)
    }
  }

  const getPrivacyIcon = (privacy: string) => {
    return privacy === 'public' ? (
      <Globe className="w-4 h-4 text-green-500" />
    ) : (
      <Lock className="w-4 h-4 text-gray-500" />
    )
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Library className="w-8 h-8 text-blue-500" />
                题库中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                浏览和下载高质量题库，提升学习效率
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="/library/my"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                我的题库
              </a>
              <a
                href="/library/create"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建题库
              </a>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索题库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  分类筛选:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setCategory(cat.value)
                      setOffset(0)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      category === cat.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                排序:
              </span>
              <div className="flex gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                      sortBy === option.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Libraries Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
            </div>
          ) : libraries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">暂无题库</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {libraries.map((library, index) => (
                <motion.div
                  key={library.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Library Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <a
                                href={`/library/${library.id}`}
                                className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-500 transition"
                              >
                                {library.name}
                              </a>
                              {getPrivacyIcon(library.privacy)}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                              {library.description || '暂无描述'}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {library.creator?.username || '匿名用户'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDistanceToNow(new Date(library.created_at), {
                                  addSuffix: true,
                                  locale: zhCN,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category Tag */}
                        {library.category && (
                          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                            {library.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {library.question_count || 0} 题
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {library.download_count || 0} 下载
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {library.view_count || 0} 浏览
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 cursor-pointer transition ${
                                star <= (library.rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                              onClick={() => handleRate(library.id, star)}
                            />
                          ))}
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                            ({library.rating_count || 0})
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <a
                          href={`/library/${library.id}`}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          查看详情
                        </a>
                        <button
                          onClick={() => handleDownload(library.id, library.name)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          下载题库
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Load More */}
          {libraries.length >= limit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={isFetching}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    加载中...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    加载更多
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
