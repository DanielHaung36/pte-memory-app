'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, FileText, AlertCircle, TrendingUp, BarChart3, Shield,
  Settings, BookOpen, UserCheck, Clock, Activity
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/stats', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 403) {
        alert('权限不足，需要管理员权限')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const dashboardCards = [
    {
      title: '总用户数',
      value: stats?.total_users || 0,
      icon: <Users className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      link: '/admin/users',
    },
    {
      title: '封禁用户',
      value: stats?.banned_users || 0,
      icon: <UserCheck className="h-6 w-6" />,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
      link: '/admin/users?status=banned',
    },
    {
      title: '待审核题目',
      value: stats?.pending_questions || 0,
      icon: <FileText className="h-6 w-6" />,
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'from-orange-50 to-yellow-50',
      link: '/admin/questions',
    },
    {
      title: '待处理举报',
      value: stats?.pending_reports || 0,
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      link: '/admin/reports',
    },
  ]

  const quickActions = [
    {
      title: '用户管理',
      description: '查看和管理所有用户',
      icon: <Users className="h-8 w-8" />,
      color: 'from-blue-500 to-cyan-500',
      link: '/admin/users',
    },
    {
      title: '题目审核',
      description: '审核用户提交的题目',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-500',
      link: '/admin/questions',
    },
    {
      title: '系统配置',
      description: '管理系统设置',
      icon: <Settings className="h-8 w-8" />,
      color: 'from-purple-500 to-indigo-500',
      link: '/admin/settings',
    },
    {
      title: '操作日志',
      description: '查看管理员操作记录',
      icon: <Activity className="h-8 w-8" />,
      color: 'from-orange-500 to-red-500',
      link: '/admin/logs',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  管理后台
                </h1>
                <p className="text-gray-600 mt-1">系统管理与监控中心</p>
              </div>
            </div>

            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
              >
                返回用户端
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <Link key={index} href={card.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`bg-gradient-to-br ${card.bgColor} rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${card.color} rounded-xl text-white group-hover:scale-110 transition-transform`}>
                    {card.icon}
                  </div>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            快速操作
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.link}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className={`inline-flex p-3 bg-gradient-to-r ${action.color} rounded-xl text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-600" />
              今日活动
            </h2>
            <Link href="/admin/logs">
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                查看全部 →
              </button>
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">今日新增用户</p>
                  <p className="text-sm text-gray-500">系统自动统计</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats?.today_signups || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">今日登录用户</p>
                  <p className="text-sm text-gray-500">系统自动统计</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.today_logins || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
