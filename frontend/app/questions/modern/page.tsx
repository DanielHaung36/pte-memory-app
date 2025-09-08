'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, BookOpen, Edit3, Trash2, Eye, Play, 
  Filter, SortDesc, Calendar, Clock, Brain, Star,
  Volume2, VolumeX, Heart, Zap, Trophy, Target,
  BarChart3, TrendingUp, Users, Globe, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { toast } from 'react-hot-toast'
import { AIServices } from '@/lib/ai-services'
import '../../../styles/design-system.css'

interface Question {
  id: string
  title: string
  content: string
  correct_answer?: string
  audio_url?: string
  question_type: 'listening' | 'speaking' | 'reading' | 'writing'
  difficulty_level: number
  tags: string[]
  created_at: string
  next_review_date?: string
  mastery_level?: number
  study_count?: number
}

interface FilterState {
  search: string
  type: string
  difficulty: string
  tags: string[]
  sortBy: 'created_at' | 'next_review_date' | 'difficulty_level' | 'mastery_level'
  sortOrder: 'asc' | 'desc'
}

const HealingQuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    type: '',
    difficulty: '',
    tags: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [stats, setStats] = useState({
    total: 0,
    byType: { listening: 0, speaking: 0, reading: 0, writing: 0 },
    avgDifficulty: 0,
    masteryRate: 0
  })

  const questionTypes = [
    { id: 'listening', name: '听力', icon: Volume2, color: 'blue', gradient: 'from-blue-400 to-blue-600' },
    { id: 'speaking', name: '口语', icon: Users, color: 'red', gradient: 'from-red-400 to-red-600' },
    { id: 'reading', name: '阅读', icon: BookOpen, color: 'green', gradient: 'from-green-400 to-green-600' },
    { id: 'writing', name: '写作', icon: Edit3, color: 'purple', gradient: 'from-purple-400 to-purple-600' }
  ]

  useEffect(() => {
    fetchQuestions()
  }, [filter])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.search) params.append('search', filter.search)
      if (filter.type) params.append('type', filter.type)
      if (filter.difficulty) params.append('difficulty', filter.difficulty)
      params.append('sort', filter.sortBy)
      params.append('order', filter.sortOrder)

      const response = await axios.get(`/api/questions?${params}`)
      const questionsData = response.data.questions || []
      setQuestions(questionsData)
      
      // Calculate stats
      calculateStats(questionsData)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      toast.error('获取题目失败')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (questionsData: Question[]) => {
    const total = questionsData.length
    const byType = questionsData.reduce((acc, q) => {
      acc[q.question_type] = (acc[q.question_type] || 0) + 1
      return acc
    }, {} as any)

    const avgDifficulty = questionsData.reduce((sum, q) => sum + q.difficulty_level, 0) / total || 0
    const masteryRate = questionsData
      .filter(q => q.mastery_level !== undefined)
      .reduce((sum, q) => sum + (q.mastery_level || 0), 0) / total || 0

    setStats({
      total,
      byType: { listening: 0, speaking: 0, reading: 0, writing: 0, ...byType },
      avgDifficulty,
      masteryRate: masteryRate * 100
    })
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('确定要删除这个题目吗？')) return

    try {
      await axios.delete(`/api/questions/${id}`)
      setQuestions(prev => prev.filter(q => q.id !== id))
      toast.success('题目删除成功')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedQuestions.size} 个题目吗？`)) return

    try {
      await Promise.all(
        Array.from(selectedQuestions).map(id => axios.delete(`/api/questions/${id}`))
      )
      
      setQuestions(prev => prev.filter(q => !selectedQuestions.has(q.id)))
      setSelectedQuestions(new Set())
      toast.success(`成功删除 ${selectedQuestions.size} 个题目`)
    } catch (error) {
      toast.error('批量删除失败')
    }
  }

  const playAudio = (audioUrl: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(audioUrl)
      speechSynthesis.speak(utterance)
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-100'
      case 2: return 'text-blue-600 bg-blue-100'
      case 3: return 'text-yellow-600 bg-yellow-100'
      case 4: return 'text-orange-600 bg-orange-100'
      case 5: return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getMasteryColor = (mastery?: number) => {
    if (!mastery) return 'text-gray-400'
    if (mastery >= 0.8) return 'text-green-500'
    if (mastery >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(filter.search.toLowerCase()) ||
                         question.content.toLowerCase().includes(filter.search.toLowerCase())
    const matchesType = !filter.type || question.question_type === filter.type
    const matchesDifficulty = !filter.difficulty || question.difficulty_level.toString() === filter.difficulty
    
    return matchesSearch && matchesType && matchesDifficulty
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="healing-loader"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="healing-container">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold healing-text-gradient">题目管理</h1>
                <p className="text-gray-600 text-sm">管理你的学习题目</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="healing-button-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>添加题目</span>
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="healing-container py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="healing-grid healing-grid-4 mb-8"
        >
          <div className="healing-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-gray-600 text-sm">总题目数</div>
          </div>

          <div className="healing-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.masteryRate.toFixed(1)}%</div>
            <div className="text-gray-600 text-sm">掌握率</div>
          </div>

          <div className="healing-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgDifficulty.toFixed(1)}</div>
            <div className="text-gray-600 text-sm">平均难度</div>
          </div>

          <div className="healing-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{Object.values(stats.byType).reduce((a, b) => Math.max(a, b), 0)}</div>
            <div className="text-gray-600 text-sm">最多类型</div>
          </div>
        </motion.div>

        {/* Filter and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="healing-card p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索题目..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="healing-input pl-10 w-full"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="healing-input"
            >
              <option value="">所有类型</option>
              {questionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={filter.difficulty}
              onChange={(e) => setFilter(prev => ({ ...prev, difficulty: e.target.value }))}
              className="healing-input"
            >
              <option value="">所有难度</option>
              <option value="1">简单</option>
              <option value="2">较易</option>
              <option value="3">中等</option>
              <option value="4">较难</option>
              <option value="5">困难</option>
            </select>

            {/* Sort */}
            <select
              value={`${filter.sortBy}_${filter.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_')
                setFilter(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as any 
                }))
              }}
              className="healing-input"
            >
              <option value="created_at_desc">最新创建</option>
              <option value="created_at_asc">最早创建</option>
              <option value="difficulty_level_desc">难度降序</option>
              <option value="difficulty_level_asc">难度升序</option>
              <option value="mastery_level_asc">掌握度升序</option>
              <option value="mastery_level_desc">掌握度降序</option>
            </select>

            {/* Bulk Actions */}
            {selectedQuestions.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleBulkDelete}
                className="healing-button-soft text-red-600 hover:bg-red-50"
              >
                删除选中 ({selectedQuestions.size})
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="healing-card p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            题目类型分布
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {questionTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-xl bg-gradient-to-r ${type.gradient} text-white text-center`}
              >
                <type.icon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.byType[type.id as keyof typeof stats.byType]}</div>
                <div className="text-sm opacity-90">{type.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Questions Grid */}
        <AnimatePresence>
          {filteredQuestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="healing-card p-12 text-center"
            >
              <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无题目</h3>
              <p className="text-gray-500 mb-6">开始添加你的第一个学习题目吧</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="healing-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加题目
              </motion.button>
            </motion.div>
          ) : (
            <div className="healing-grid healing-grid-2 gap-6">
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="healing-card p-6 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedQuestions)
                          if (e.target.checked) {
                            newSelected.add(question.id)
                          } else {
                            newSelected.delete(question.id)
                          }
                          setSelectedQuestions(newSelected)
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_level)}`}>
                        难度 {question.difficulty_level}
                      </div>
                      {question.mastery_level !== undefined && (
                        <div className={`flex items-center space-x-1 text-sm ${getMasteryColor(question.mastery_level)}`}>
                          <Brain className="h-4 w-4" />
                          <span>{(question.mastery_level * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {question.audio_url && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => playAudio(question.content)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <Volume2 className="h-4 w-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingQuestion(question)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit3 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="flex items-center space-x-2 mb-3">
                    {(() => {
                      const type = questionTypes.find(t => t.id === question.question_type)
                      if (!type) return null
                      return (
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${type.gradient} text-white text-sm`}>
                          <type.icon className="h-4 w-4" />
                          <span>{type.name}</span>
                        </div>
                      )
                    })()}
                    {question.study_count && (
                      <div className="flex items-center space-x-1 text-gray-500 text-sm">
                        <Play className="h-4 w-4" />
                        <span>已练习 {question.study_count} 次</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{question.title}</h3>

                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{question.content}</p>

                  {/* Tags */}
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {question.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                      {question.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                          +{question.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(question.created_at).toLocaleDateString()}</span>
                      </div>
                      {question.next_review_date && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>下次: {new Date(question.next_review_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/review/${question.id}`}
                      className="healing-button-soft text-blue-600 hover:text-blue-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      练习
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default HealingQuestionsPage