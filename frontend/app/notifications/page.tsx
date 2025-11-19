'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  Calendar,
  Trophy,
  MessageCircle,
  Heart,
  Star,
  AlertCircle,
  Clock,
  X
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '@/lib/store/notificationApi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const notificationIcons: Record<string, React.ReactNode> = {
  review_reminder: <Calendar className="w-5 h-5 text-blue-500" />,
  achievement: <Trophy className="w-5 h-5 text-yellow-500" />,
  social: <MessageCircle className="w-5 h-5 text-purple-500" />,
  streak_broken: <AlertCircle className="w-5 h-5 text-red-500" />,
  daily_report: <Star className="w-5 h-5 text-green-500" />,
  default: <Bell className="w-5 h-5 text-gray-500" />,
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const { data: notificationsData, isLoading } = useGetNotificationsQuery({ limit: 50 })
  const { data: unreadData } = useGetUnreadCountQuery()
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()
  const [clearAll] = useClearAllNotificationsMutation()

  const notifications = notificationsData?.notifications || []
  const unreadCount = unreadData?.count || 0

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.is_read) return false
    if (selectedType && notif.type !== selectedType) return false
    return true
  })

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id).unwrap()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap()
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap()
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有通知吗？')) {
      try {
        await clearAll().unwrap()
      } catch (error) {
        console.error('清空通知失败:', error)
      }
    }
  }

  const notificationTypes = Array.from(new Set(notifications.map((n) => n.type)))

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-500" />
                通知中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知'}
              </p>
            </div>

            <a
              href="/notifications/settings"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              设置
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                全部标记为已读
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空所有
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">筛选:</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  filter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                未读
              </button>
            </div>

            {notificationTypes.length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      selectedType === null
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    全部类型
                  </button>
                  {notificationTypes.slice(0, 5).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        selectedType === type
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">暂无通知</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden ${
                    !notification.is_read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {notificationIcons[notification.type] || notificationIcons.default}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </span>

                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {notification.type}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            title="标记为已读"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          title="删除"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
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
