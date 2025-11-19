'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  Calendar,
  Trophy,
  MessageCircle,
  TrendingUp,
  Mail,
  Smartphone,
  Settings as SettingsIcon,
  ArrowLeft,
  Save,
  AlertCircle
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetPushSettingsQuery, useUpdatePushSettingsMutation } from '@/lib/store/pushApi'
import { useState, useEffect } from 'react'

interface SettingToggle {
  key: string
  label: string
  description: string
  icon: React.ReactNode
}

const settingToggles: SettingToggle[] = [
  {
    key: 'review_reminders',
    label: '复习提醒',
    description: '当有题目需要复习时通知我',
    icon: <Calendar className="w-5 h-5 text-blue-500" />,
  },
  {
    key: 'achievement_notifications',
    label: '成就通知',
    description: '获得新成就时通知我',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />,
  },
  {
    key: 'social_notifications',
    label: '社交通知',
    description: '收到评论、点赞或关注时通知我',
    icon: <MessageCircle className="w-5 h-5 text-purple-500" />,
  },
  {
    key: 'streak_reminders',
    label: '连击提醒',
    description: '连击即将中断时提醒我',
    icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
  },
  {
    key: 'daily_report',
    label: '每日报告',
    description: '每天发送学习报告',
    icon: <Mail className="w-5 h-5 text-green-500" />,
  },
  {
    key: 'marketing_notifications',
    label: '营销通知',
    description: '接收新功能和活动通知',
    icon: <AlertCircle className="w-5 h-5 text-pink-500" />,
  },
]

export default function NotificationSettingsPage() {
  const { data, isLoading } = useGetPushSettingsQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePushSettingsMutation()

  const [settings, setSettings] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings as Record<string, boolean>)
    }
  }, [data])

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap()
      setHasChanges(false)
      alert('设置已保存')
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEnableAll = () => {
    const allEnabled = settingToggles.reduce((acc, toggle) => {
      acc[toggle.key] = true
      return acc
    }, {} as Record<string, boolean>)
    setSettings(allEnabled)
    setHasChanges(true)
  }

  const handleDisableAll = () => {
    const allDisabled = settingToggles.reduce((acc, toggle) => {
      acc[toggle.key] = false
      return acc
    }, {} as Record<string, boolean>)
    setSettings(allDisabled)
    setHasChanges(true)
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
            <SettingsIcon className="w-8 h-8 text-blue-500" />
            通知设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            管理您希望接收的通知类型
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6"
        >
          <div className="flex gap-3">
            <button
              onClick={handleEnableAll}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              全部启用
            </button>
            <button
              onClick={handleDisableAll}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
            >
              <BellOff className="w-4 h-4" />
              全部关闭
            </button>
          </div>
        </motion.div>

        {/* Settings List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {settingToggles.map((toggle, index) => (
              <motion.div
                key={toggle.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{toggle.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {toggle.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {toggle.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(toggle.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[toggle.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[toggle.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              className="px-8 py-4 bg-blue-500 text-white rounded-full shadow-2xl hover:bg-blue-600 transition flex items-center gap-3 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isUpdating ? '保存中...' : '保存更改'}
            </button>
          </motion.div>
        )}

        {/* Additional Settings Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <a
            href="/reminders/settings"
            className="text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            管理提醒时间设置
          </a>
        </motion.div>
      </div>
    </div>
  )
}
