'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Star,
  Globe,
  Lock,
  Calendar,
  MoreVertical,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetMyLibrariesQuery, useDeleteLibraryMutation } from '@/lib/store/libraryApi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function MyLibrariesPage() {
  const { data, isLoading } = useGetMyLibrariesQuery()
  const [deleteLibrary] = useDeleteLibraryMutation()

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const libraries = data?.libraries || []

  const handleDelete = async (libraryId: string, libraryName: string) => {
    if (!window.confirm(`确定要删除题库 "${libraryName}" 吗？此操作无法撤销。`)) {
      return
    }

    try {
      await deleteLibrary(libraryId).unwrap()
      alert('题库已删除')
    } catch (error) {
      console.error('删除题库失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getPrivacyBadge = (privacy: string) => {
    return privacy === 'public' ? (
      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
        <Globe className="w-3 h-3" />
        公开
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
        <Lock className="w-3 h-3" />
        私密
      </span>
    )
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
            href="/library"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回题库中心
          </a>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                我的题库
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                管理您创建的所有题库
              </p>
            </div>

            <a
              href="/library/create"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              创建题库
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">题库总数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {libraries.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">公开题库</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {libraries.filter((lib) => lib.privacy === 'public').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Download className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总下载量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {libraries.reduce((sum, lib) => sum + (lib.download_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Libraries List */}
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
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md"
            >
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                您还没有创建任何题库
              </p>
              <a
                href="/library/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Plus className="w-4 h-4" />
                创建第一个题库
              </a>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {libraries.map((library, index) => (
                <motion.div
                  key={library.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
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
                              {getPrivacyBadge(library.privacy)}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                              {library.description || '暂无描述'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDistanceToNow(new Date(library.created_at), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        {library.category && (
                          <span className="ml-14 inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                            {library.category}
                          </span>
                        )}
                      </div>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === library.id ? null : library.id)
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>

                        {openMenuId === library.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10"
                          >
                            <a
                              href={`/library/${library.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                            >
                              <Eye className="w-4 h-4" />
                              查看详情
                            </a>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                // TODO: Navigate to edit page
                                window.location.href = `/library/edit/${library.id}`
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                              编辑
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                handleDelete(library.id, library.name)
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {library.rating ? library.rating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({library.rating_count || 0})
                          </span>
                        </div>
                      </div>

                      <a
                        href={`/library/${library.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
