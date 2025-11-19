'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Users,
  Lock,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetUserProfileQuery, useUpdateUserMutation } from '@/lib/store/userApi'

interface PrivacySetting {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  options: {
    value: string
    label: string
    icon: React.ReactNode
  }[]
}

const privacySettings: PrivacySetting[] = [
  {
    key: 'profile_visibility',
    label: '个人资料可见性',
    description: '控制谁可以查看您的个人资料',
    icon: <Eye className="w-5 h-5" />,
    options: [
      { value: 'public', label: '公开', icon: <Globe className="w-4 h-4" /> },
      { value: 'friends', label: '仅好友', icon: <Users className="w-4 h-4" /> },
      { value: 'private', label: '仅自己', icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    key: 'activity_visibility',
    label: '学习活动可见性',
    description: '控制谁可以看到您的学习记录和成就',
    icon: <Eye className="w-5 h-5" />,
    options: [
      { value: 'public', label: '公开', icon: <Globe className="w-4 h-4" /> },
      { value: 'friends', label: '仅好友', icon: <Users className="w-4 h-4" /> },
      { value: 'private', label: '仅自己', icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    key: 'library_visibility',
    label: '题库可见性',
    description: '控制您创建的题库的默认可见性',
    icon: <Eye className="w-5 h-5" />,
    options: [
      { value: 'public', label: '公开', icon: <Globe className="w-4 h-4" /> },
      { value: 'private', label: '私密', icon: <Lock className="w-4 h-4" /> },
    ],
  },
]

const dataPrivacyToggles = [
  {
    key: 'allow_friend_requests',
    label: '允许好友请求',
    description: '其他用户可以向您发送好友请求',
  },
  {
    key: 'show_online_status',
    label: '显示在线状态',
    description: '让其他用户看到您是否在线',
  },
  {
    key: 'allow_messages',
    label: '允许私信',
    description: '其他用户可以向您发送私信',
  },
  {
    key: 'allow_analytics',
    label: '数据分析',
    description: '允许收集匿名使用数据以改进服务',
  },
  {
    key: 'allow_personalized_ads',
    label: '个性化推荐',
    description: '基于您的学习习惯提供个性化内容推荐',
  },
]

export default function PrivacySettingsPage() {
  const { data: userProfile } = useGetUserProfileQuery()
  const [updateUser, { isLoading, isSuccess, isError }] = useUpdateUserMutation()

  const [privacyValues, setPrivacyValues] = useState<Record<string, string>>({
    profile_visibility: 'public',
    activity_visibility: 'public',
    library_visibility: 'public',
  })

  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({
    allow_friend_requests: true,
    show_online_status: true,
    allow_messages: true,
    allow_analytics: true,
    allow_personalized_ads: true,
  })

  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (userProfile?.privacy_settings) {
      const settings = userProfile.privacy_settings as any
      setPrivacyValues({
        profile_visibility: settings.profile_visibility || 'public',
        activity_visibility: settings.activity_visibility || 'public',
        library_visibility: settings.library_visibility || 'public',
      })
      setToggleValues({
        allow_friend_requests: settings.allow_friend_requests ?? true,
        show_online_status: settings.show_online_status ?? true,
        allow_messages: settings.allow_messages ?? true,
        allow_analytics: settings.allow_analytics ?? true,
        allow_personalized_ads: settings.allow_personalized_ads ?? true,
      })
    }
  }, [userProfile])

  const handlePrivacyChange = (key: string, value: string) => {
    setPrivacyValues((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleToggleChange = (key: string) => {
    setToggleValues((prev) => ({ ...prev, [key]: !prev[key] }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateUser({
        privacy_settings: {
          ...privacyValues,
          ...toggleValues,
        },
      }).unwrap()
      setHasChanges(false)
      alert('隐私设置已保存')
    } catch (error) {
      console.error('保存隐私设置失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        '警告：删除账号将永久删除您的所有数据，包括题目、学习记录等。此操作不可撤销！\n\n确定要删除账号吗？'
      )
    ) {
      if (window.confirm('请再次确认：您确定要删除账号吗？')) {
        // TODO: Implement account deletion
        alert('账号删除功能正在开发中')
      }
    }
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
            href="/settings"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回设置
          </a>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-500" />
            隐私设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            控制您的隐私和数据共享偏好
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              隐私设置已保存
            </span>
          </motion.div>
        )}

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

        {/* Visibility Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-500" />
            可见性设置
          </h2>

          <div className="space-y-6">
            {privacySettings.map((setting, index) => (
              <div
                key={setting.key}
                className={`${
                  index !== privacySettings.length - 1
                    ? 'pb-6 border-b border-gray-200 dark:border-gray-700'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    {setting.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {setting.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {setting.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-11">
                  {setting.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePrivacyChange(setting.key, option.value)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                        privacyValues[setting.key] === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Data Privacy Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-500" />
            数据隐私
          </h2>

          <div className="space-y-3">
            {dataPrivacyToggles.map((toggle, index) => (
              <div
                key={toggle.key}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {toggle.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {toggle.description}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleChange(toggle.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggleValues[toggle.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggleValues[toggle.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            危险操作
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                删除账号
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                永久删除您的账号和所有相关数据。此操作不可撤销！
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除我的账号
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-4 bg-blue-500 text-white rounded-full shadow-2xl hover:bg-blue-600 transition flex items-center gap-3 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isLoading ? '保存中...' : '保存更改'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
