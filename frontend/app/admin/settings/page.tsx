'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings, ArrowLeft, Loader2, Save, Plus, Edit, Trash2,
  AlertCircle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingConfig, setEditingConfig] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfigs()
  }, [categoryFilter])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const params = categoryFilter ? `?category=${categoryFilter}` : ''
      const response = await fetch(
        `http://localhost:8080/api/admin/configs${params}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      } else if (response.status === 403) {
        alert('权限不足')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (key: string, value: string, description?: string) => {
    setSaving(true)
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/configs/${key}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, description }),
        }
      )

      if (response.ok) {
        alert('配置已更新')
        setEditingConfig(null)
        fetchConfigs()
      } else {
        const data = await response.json()
        alert(data.error || '更新失败')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateConfig = async (configData: any) => {
    setSaving(true)
    try {
      const response = await fetch(
        'http://localhost:8080/api/admin/configs',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configData),
        }
      )

      if (response.ok) {
        alert('配置已创建')
        setEditingConfig(null)
        fetchConfigs()
      } else {
        const data = await response.json()
        alert(data.error || '创建失败')
      }
    } catch (error) {
      console.error('Failed to create config:', error)
      alert('创建失败')
    } finally {
      setSaving(false)
    }
  }

  const categories = [...new Set(configs.map(c => c.category))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
              </Link>
              <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  系统配置
                </h1>
                <p className="text-gray-600 mt-1">管理系统设置和参数</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setEditingConfig({
                  key: '',
                  value: '',
                  category: 'general',
                  description: '',
                  isNew: true,
                })
              }
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              新增配置
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-6"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            配置分类
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">全部分类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Config List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : configs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-100 text-center"
          >
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无配置项
            </h3>
            <p className="text-gray-600">点击"新增配置"创建第一个配置项</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {configs.map((config, index) => (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
              >
                {editingConfig?.key === config.key ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        配置键
                      </label>
                      <input
                        type="text"
                        value={config.key}
                        disabled
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        配置值
                      </label>
                      <textarea
                        value={editingConfig.value}
                        onChange={(e) =>
                          setEditingConfig({ ...editingConfig, value: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        描述
                      </label>
                      <input
                        type="text"
                        value={editingConfig.description || ''}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleSaveConfig(
                            config.key,
                            editingConfig.value,
                            editingConfig.description
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        保存
                      </motion.button>
                      <button
                        onClick={() => setEditingConfig(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {config.key}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-600">
                          {config.category}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">当前值：</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg font-mono text-sm">
                          {config.value}
                        </p>
                      </div>

                      {config.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {config.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-400">
                        最后更新：{new Date(config.updated_at).toLocaleString('zh-CN')}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setEditingConfig({
                          ...config,
                          isNew: false,
                        })
                      }
                      className="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      编辑
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* New Config Modal */}
        {editingConfig?.isNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingConfig(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">新增配置</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配置键 *
                  </label>
                  <input
                    type="text"
                    value={editingConfig.key}
                    onChange={(e) =>
                      setEditingConfig({ ...editingConfig, key: e.target.value })
                    }
                    placeholder="例如: max_upload_size"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配置值 *
                  </label>
                  <textarea
                    value={editingConfig.value}
                    onChange={(e) =>
                      setEditingConfig({ ...editingConfig, value: e.target.value })
                    }
                    placeholder="配置的值"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 *
                  </label>
                  <input
                    type="text"
                    value={editingConfig.category}
                    onChange={(e) =>
                      setEditingConfig({ ...editingConfig, category: e.target.value })
                    }
                    placeholder="例如: general, security"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <input
                    type="text"
                    value={editingConfig.description || ''}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        description: e.target.value,
                      })
                    }
                    placeholder="配置项的说明"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCreateConfig(editingConfig)}
                    disabled={saving || !editingConfig.key || !editingConfig.value}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5 mr-2" />
                    )}
                    创建配置
                  </motion.button>
                  <button
                    onClick={() => setEditingConfig(null)}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
