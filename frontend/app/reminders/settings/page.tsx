'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Bell,
  Calendar,
  TrendingUp,
  Target,
  Mail,
  Smartphone,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetReminderSettingsQuery, useUpdateReminderSettingsMutation } from '@/lib/store/notificationApi'
import { useState, useEffect } from 'react'

interface ReminderSetting {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const reminderTypes: ReminderSetting[] = [
  {
    key: 'daily_reminder_enabled',
    label: '每日提醒',
    description: '每天固定时间提醒您学习',
    icon: <Calendar className="w-5 h-5" />,
    color: 'blue',
  },
  {
    key: 'review_reminder_enabled',
    label: '复习提醒',
    description: '当有题目需要复习时提醒',
    icon: <Bell className="w-5 h-5" />,
    color: 'green',
  },
  {
    key: 'streak_reminder_enabled',
    label: '连击提醒',
    description: '连击即将中断时提醒',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'orange',
  },
  {
    key: 'goal_reminder_enabled',
    label: '目标提醒',
    description: '学习目标进度提醒',
    icon: <Target className="w-5 h-5" />,
    color: 'purple',
  },
]

export default function ReminderSettingsPage() {
  const { data, isLoading } = useGetReminderSettingsQuery()
  const [updateSettings, { isLoading: isUpdating, isSuccess, isError, error }] = useUpdateReminderSettingsMutation()

  const [settings, setSettings] = useState({
    daily_reminder_time: '09:00',
    review_advance_hours: 1,
    daily_reminder_enabled: true,
    review_reminder_enabled: true,
    streak_reminder_enabled: true,
    goal_reminder_enabled: false,
    email_notifications: false,
    push_notifications: true,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (data?.settings) {
      setSettings({
        daily_reminder_time: data.settings.daily_reminder_time || '09:00',
        review_advance_hours: data.settings.review_advance_hours || 1,
        daily_reminder_enabled: data.settings.daily_reminder_enabled ?? true,
        review_reminder_enabled: data.settings.review_reminder_enabled ?? true,
        streak_reminder_enabled: data.settings.streak_reminder_enabled ?? true,
        goal_reminder_enabled: data.settings.goal_reminder_enabled ?? false,
        email_notifications: data.settings.email_notifications ?? false,
        push_notifications: data.settings.push_notifications ?? true,
      })
    }
  }, [data])

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      setHasChanges(false)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }, [isSuccess])

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
    setHasChanges(true)
  }

  const handleTimeChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      daily_reminder_time: value,
    }))
    setHasChanges(true)
  }

  const handleAdvanceHoursChange = (value: number) => {
    setSettings((prev) => ({
      ...prev,
      review_advance_hours: value,
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap()
    } catch (err) {
      console.error('保存提醒设置失败:', err)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
    }
    return colors[color] || 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AppNavigation />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <a
            href="/notifications"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回通知中心
          </a>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            提醒时间设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            自定义您的学习提醒时间和方式
          </p>
        </motion.div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300 font-medium">设置已保存</span>
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
              保存失败，请重试
            </span>
          </motion.div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Reminder Time */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    每日提醒时间
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    设置每天接收学习提醒的时间
                  </p>
                </div>
              </div>

              <input
                type="time"
                value={settings.daily_reminder_time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </motion.div>

            {/* Review Advance Notice */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Bell className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    复习提前通知
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    在复习时间前多久通知您
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={settings.review_advance_hours}
                  onChange={(e) => handleAdvanceHoursChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[4rem] text-right">
                  {settings.review_advance_hours} 小时
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>不提前</span>
                <span>1天</span>
              </div>
            </motion.div>

            {/* Reminder Types */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                提醒类型
              </h3>

              <div className="space-y-3">
                {reminderTypes.map((reminder, index) => (
                  <motion.div
                    key={reminder.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getColorClasses(reminder.color)}>
                        {reminder.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {reminder.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reminder.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(reminder.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[reminder.key as keyof typeof settings]
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[reminder.key as keyof typeof settings]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Notification Method */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                通知方式
              </h3>

              <div className="space-y-3">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-pink-500" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        邮件通知
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        通过邮件接收提醒
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle('email_notifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.email_notifications
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        推送通知
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        通过推送接收提醒
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle('push_notifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.push_notifications
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-8 py-4 bg-blue-500 text-white rounded-full shadow-2xl hover:bg-blue-600 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isUpdating ? '保存中...' : '保存更改'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
