'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import {
  Calendar as CalendarIcon, Clock, Target, TrendingUp, Flame,
  CheckCircle, AlertCircle, Star, Brain, Award, BookOpen,
  ArrowLeft, ArrowRight, MoreHorizontal, Sparkles, Zap,
  BarChart3, Users, MapPin, Coffee, Sunrise, Moon
} from 'lucide-react'
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import 'react-calendar/dist/Calendar.css'

interface ReviewSession {
  id: string
  date: Date
  questionsReviewed: number
  correctAnswers: number
  studyTime: number // minutes
  streak: number
  type: 'scheduled' | 'extra' | 'intensive'
}

interface CalendarData {
  date: Date
  sessions: ReviewSession[]
  dueQuestions: number
  completedQuestions: number
  masteryGained: number
  streak: number
  mood?: 'excellent' | 'good' | 'okay' | 'challenging'
}

const MOOD_CONFIGS = {
  excellent: { emoji: '🤩', color: 'from-green-400 to-emerald-500', label: '完美状态' },
  good: { emoji: '😊', color: 'from-blue-400 to-cyan-500', label: '状态良好' },
  okay: { emoji: '😐', color: 'from-yellow-400 to-orange-400', label: '一般状态' },
  challenging: { emoji: '😅', color: 'from-red-400 to-pink-500', label: '需要努力' }
}

const SESSION_TYPES = {
  scheduled: { label: '计划复习', color: 'bg-blue-500', icon: '📅' },
  extra: { label: '额外练习', color: 'bg-green-500', icon: '💪' },
  intensive: { label: '强化训练', color: 'bg-purple-500', icon: '🚀' }
}

interface ReviewCalendarProps {
  className?: string
  onDateSelect?: (date: Date) => void
  showStats?: boolean
}

export default function ReviewCalendar({ className = '', onDateSelect, showStats = true }: ReviewCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, CalendarData>>({})
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'stats'>('calendar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarData()
  }, [currentMonth])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      
      // Generate mock data for the calendar
      const startDate = startOfMonth(currentMonth)
      const endDate = endOfMonth(currentMonth)
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
      
      const mockData: Record<string, CalendarData> = {}
      
      daysInMonth.forEach((date, index) => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const hasSession = Math.random() > 0.3 // 70% chance of having a session
        
        if (hasSession) {
          const sessionsCount = Math.floor(Math.random() * 3) + 1
          const sessions: ReviewSession[] = []
          
          for (let i = 0; i < sessionsCount; i++) {
            const sessionTypes = Object.keys(SESSION_TYPES) as Array<keyof typeof SESSION_TYPES>
            const randomType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)]
            
            sessions.push({
              id: `session-${index}-${i}`,
              date,
              questionsReviewed: Math.floor(Math.random() * 20) + 5,
              correctAnswers: Math.floor(Math.random() * 15) + 3,
              studyTime: Math.floor(Math.random() * 60) + 15,
              streak: Math.floor(Math.random() * 10) + 1,
              type: randomType
            })
          }
          
          const moods = Object.keys(MOOD_CONFIGS) as Array<keyof typeof MOOD_CONFIGS>
          const randomMood = moods[Math.floor(Math.random() * moods.length)]
          
          mockData[dateKey] = {
            date,
            sessions,
            dueQuestions: Math.floor(Math.random() * 10),
            completedQuestions: sessions.reduce((sum, s) => sum + s.questionsReviewed, 0),
            masteryGained: Math.floor(Math.random() * 25) + 5,
            streak: Math.max(...sessions.map(s => s.streak)),
            mood: randomMood
          }
        }
      })
      
      setCalendarData(mockData)
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const getDayData = (date: Date): CalendarData | null => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return calendarData[dateKey] || null
  }

  const getSelectedDateData = (): CalendarData | null => {
    return getDayData(selectedDate)
  }

  const getTileContent = (date: Date) => {
    const dayData = getDayData(date)
    if (!dayData) return null

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Mood indicator */}
        {dayData.mood && (
          <div className="text-xs mb-1">
            {MOOD_CONFIGS[dayData.mood].emoji}
          </div>
        )}
        
        {/* Session indicators */}
        <div className="flex flex-wrap gap-0.5 max-w-full">
          {dayData.sessions.slice(0, 3).map((session, index) => (
            <div
              key={session.id}
              className={`w-1.5 h-1.5 rounded-full ${SESSION_TYPES[session.type].color}`}
            />
          ))}
          {dayData.sessions.length > 3 && (
            <div className="text-[8px] text-gray-500 font-bold">+</div>
          )}
        </div>
        
        {/* Streak indicator */}
        {dayData.streak >= 3 && (
          <div className="text-[10px]">🔥</div>
        )}
      </div>
    )
  }

  const getTileClassName = (date: Date) => {
    const dayData = getDayData(date)
    const isSelected = isSameDay(date, selectedDate)
    const isToday = isSameDay(date, new Date())
    
    let className = 'relative hover:bg-blue-50 transition-colors duration-200 '
    
    if (isSelected) {
      className += 'bg-blue-500 text-white '
    } else if (isToday) {
      className += 'bg-blue-100 text-blue-700 font-semibold '
    }
    
    if (dayData) {
      if (dayData.sessions.length > 0) {
        className += 'bg-green-50 '
      }
      if (dayData.dueQuestions > 0) {
        className += 'ring-2 ring-orange-200 '
      }
    }
    
    return className
  }

  const monthStats = React.useMemo(() => {
    const monthData = Object.values(calendarData)
    const totalSessions = monthData.reduce((sum, day) => sum + day.sessions.length, 0)
    const totalQuestions = monthData.reduce((sum, day) => sum + day.completedQuestions, 0)
    const totalStudyTime = monthData.reduce((sum, day) => 
      sum + day.sessions.reduce((sessionSum, session) => sessionSum + session.studyTime, 0), 0)
    const maxStreak = Math.max(...monthData.map(day => day.streak), 0)
    const avgMastery = monthData.length > 0 
      ? Math.round(monthData.reduce((sum, day) => sum + day.masteryGained, 0) / monthData.length)
      : 0

    return {
      totalSessions,
      totalQuestions,
      totalStudyTime,
      maxStreak,
      avgMastery,
      studyDays: monthData.filter(day => day.sessions.length > 0).length
    }
  }, [calendarData])

  if (loading) {
    return (
      <div className={`healing-card p-8 text-center ${className}`}>
        <div className="healing-loader mx-auto mb-4"></div>
        <p className="text-gray-500">加载日历数据中...</p>
      </div>
    )
  }

  return (
    <div className={`healing-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold healing-text-gradient">学习日历</h2>
              <p className="text-gray-600">追踪你的学习进度和复习计划</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'stats' ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {showStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthStats.studyDays}</div>
              <div className="text-sm text-gray-500">学习天数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{monthStats.totalQuestions}</div>
              <div className="text-sm text-gray-500">完成题目</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(monthStats.totalStudyTime / 60)}h</div>
              <div className="text-sm text-gray-500">学习时长</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{monthStats.maxStreak}🔥</div>
              <div className="text-sm text-gray-500">最长连击</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Custom Calendar */}
              <div className="healing-calendar">
                <Calendar
                  onChange={(value: any) => handleDateClick(value as Date)}
                  value={selectedDate}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) setCurrentMonth(activeStartDate)
                  }}
                  tileContent={({ date }) => getTileContent(date)}
                  tileClassName={({ date }) => getTileClassName(date)}
                  locale="zh-CN"
                />
              </div>
              
              {/* Legend */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">图例说明</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>计划复习</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>额外练习</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>强化训练</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🔥</span>
                    <span>连击3天+</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Monthly Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    本月表现
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">学习会话</span>
                      <span className="font-semibold">{monthStats.totalSessions} 次</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均掌握度提升</span>
                      <span className="font-semibold text-green-600">+{monthStats.avgMastery}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">日均学习时长</span>
                      <span className="font-semibold">
                        {Math.round(monthStats.totalStudyTime / Math.max(monthStats.studyDays, 1))} 分钟
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Flame className="h-5 w-5 mr-2 text-orange-600" />
                    学习习惯
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">连续学习</span>
                      <span className="font-semibold text-orange-600">{monthStats.maxStreak} 天</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">学习频率</span>
                      <span className="font-semibold">
                        {Math.round((monthStats.studyDays / new Date().getDate()) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最佳状态天数</span>
                      <span className="font-semibold text-green-600">
                        {Object.values(calendarData).filter(day => day.mood === 'excellent').length} 天
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Achievement Timeline */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  近期成就
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>连续学习 {monthStats.maxStreak} 天</span>
                    <span className="text-gray-400">• 昨天</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>完成 {monthStats.totalQuestions} 道题目复习</span>
                    <span className="text-gray-400">• 本月</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>掌握度平均提升 {monthStats.avgMastery}%</span>
                    <span className="text-gray-400">• 本月</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence>
        {getSelectedDateData() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-purple-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                {format(selectedDate, 'yyyy年M月d日')} 学习详情
              </h3>
              {getSelectedDateData()?.mood && (
                <div className="flex items-center space-x-2">
                  <span>{MOOD_CONFIGS[getSelectedDateData()!.mood!].emoji}</span>
                  <span className="text-sm text-gray-600">
                    {MOOD_CONFIGS[getSelectedDateData()!.mood!].label}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  学习会话
                </h4>
                {getSelectedDateData()?.sessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                    <span className="flex items-center">
                      <span className="mr-2">{SESSION_TYPES[session.type].icon}</span>
                      {SESSION_TYPES[session.type].label}
                    </span>
                    <span className="text-gray-500">{session.studyTime}分钟</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  完成情况
                </h4>
                <div className="text-sm bg-white p-2 rounded-lg">
                  <div className="flex justify-between">
                    <span>复习题目</span>
                    <span className="font-semibold">{getSelectedDateData()?.completedQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>掌握度提升</span>
                    <span className="font-semibold text-green-600">+{getSelectedDateData()?.masteryGained}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Flame className="h-4 w-4 mr-1" />
                  连击记录
                </h4>
                <div className="text-sm bg-white p-2 rounded-lg">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">🔥</span>
                    <span className="font-bold text-orange-600 text-lg">
                      {getSelectedDateData()?.streak} 天连击
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}