'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Smartphone,
  Key,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import { useGetMeQuery } from '@/lib/store/authApi'
import { useRouter } from 'next/navigation'

const settingSections = [
  {
    title: '账号设置',
    items: [
      {
        icon: <User className="w-5 h-5" />,
        label: '个人资料',
        description: '编辑您的个人信息和头像',
        href: '/settings/profile',
        color: 'blue',
      },
      {
        icon: <Mail className="w-5 h-5" />,
        label: '账号信息',
        description: '管理邮箱、密码等账号信息',
        href: '/settings/account',
        color: 'green',
      },
      {
        icon: <Key className="w-5 h-5" />,
        label: '安全设置',
        description: '密码、两步验证等安全选项',
        href: '/settings/security',
        color: 'red',
      },
    ],
  },
  {
    title: '隐私与通知',
    items: [
      {
        icon: <Shield className="w-5 h-5" />,
        label: '隐私设置',
        description: '控制您的隐私和数据共享',
        href: '/settings/privacy',
        color: 'purple',
      },
      {
        icon: <Bell className="w-5 h-5" />,
        label: '通知设置',
        description: '管理通知偏好和提醒',
        href: '/notifications/settings',
        color: 'orange',
      },
      {
        icon: <Smartphone className="w-5 h-5" />,
        label: '推送通知',
        description: '设备和推送通知管理',
        href: '/settings/push',
        color: 'pink',
      },
    ],
  },
  {
    title: '偏好设置',
    items: [
      {
        icon: <Palette className="w-5 h-5" />,
        label: '外观主题',
        description: '切换浅色/深色主题',
        href: '/settings/appearance',
        color: 'indigo',
      },
      {
        icon: <Globe className="w-5 h-5" />,
        label: '语言设置',
        description: '选择界面显示语言',
        href: '/settings/language',
        color: 'cyan',
      },
    ],
  },
  {
    title: '帮助与支持',
    items: [
      {
        icon: <HelpCircle className="w-5 h-5" />,
        label: '帮助中心',
        description: '查看常见问题和使用指南',
        href: '/help',
        color: 'teal',
      },
    ],
  },
]

const getColorClasses = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  }
  return colors[color] || colors.blue
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: userProfile } = useGetMeQuery()

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      // Clear auth and redirect to login
      localStorage.clear()
      router.push('/auth/login')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-500" />
            设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理您的账号、隐私和应用偏好设置
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userProfile?.username || '用户'}</h2>
              <p className="text-white/80">{userProfile?.email || 'user@example.com'}</p>
            </div>
            <a
              href="/settings/profile"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              编辑资料
            </a>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                      itemIndex !== section.items.length - 1
                        ? 'border-b border-gray-200 dark:border-gray-700'
                        : ''
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${getColorClasses(item.color)}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          PTE Memory App v1.0.0
        </motion.div>
      </div>
    </div>
  )
}
