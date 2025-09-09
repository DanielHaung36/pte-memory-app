'use client'

import { useState, useEffect } from 'react'
import { Zap, Flame, Star, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StreakCounterProps {
  currentStreak: number
  bestStreak: number
  onStreakUpdate?: (newStreak: number) => void
  showAnimation?: boolean
}

export default function StreakCounter({ 
  currentStreak, 
  bestStreak, 
  onStreakUpdate,
  showAnimation = true 
}: StreakCounterProps) {
  const [displayStreak, setDisplayStreak] = useState(currentStreak)
  const [showStreakEffect, setShowStreakEffect] = useState(false)
  const [streakLevel, setStreakLevel] = useState(0)

  useEffect(() => {
    if (currentStreak !== displayStreak) {
      if (currentStreak > displayStreak && showAnimation) {
        setShowStreakEffect(true)
        setTimeout(() => setShowStreakEffect(false), 1000)
      }
      setDisplayStreak(currentStreak)
    }
  }, [currentStreak, displayStreak, showAnimation])

  useEffect(() => {
    // Calculate streak level
    if (displayStreak >= 50) setStreakLevel(5)
    else if (displayStreak >= 20) setStreakLevel(4)
    else if (displayStreak >= 10) setStreakLevel(3)
    else if (displayStreak >= 5) setStreakLevel(2)
    else if (displayStreak >= 3) setStreakLevel(1)
    else setStreakLevel(0)
  }, [displayStreak])

  const getStreakConfig = () => {
    switch (streakLevel) {
      case 5:
        return {
          name: '传奇大师',
          color: 'from-red-500 to-pink-600',
          icon: Trophy,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          multiplier: '3.0x'
        }
      case 4:
        return {
          name: '超级专家',
          color: 'from-purple-500 to-indigo-600',
          icon: Star,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          multiplier: '2.5x'
        }
      case 3:
        return {
          name: '连击高手',
          color: 'from-orange-500 to-red-500',
          icon: Flame,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-600',
          multiplier: '2.0x'
        }
      case 2:
        return {
          name: '渐入佳境',
          color: 'from-green-500 to-emerald-600',
          icon: Zap,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          multiplier: '1.5x'
        }
      case 1:
        return {
          name: '小试牛刀',
          color: 'from-blue-500 to-cyan-600',
          icon: Zap,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          multiplier: '1.2x'
        }
      default:
        return {
          name: '刚刚开始',
          color: 'from-gray-400 to-gray-500',
          icon: Zap,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          multiplier: '1.0x'
        }
    }
  }

  const config = getStreakConfig()
  const Icon = config.icon

  return (
    <div className="relative">
      <div className={`card p-6 ${config.bgColor} border-2 border-transparent hover:border-gray-300 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full bg-gradient-to-r ${config.color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">连击数</h3>
              <p className={`text-sm ${config.textColor} font-medium`}>{config.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${config.textColor}`}>
              {displayStreak}
            </div>
            <div className="text-sm text-gray-500">
              最高: {bestStreak}
            </div>
          </div>
        </div>

        {/* Streak Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>经验加成</span>
            <span className="font-bold">{config.multiplier}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
              style={{
                width: `${Math.min(100, (displayStreak % 10) * 10 + 10)}%`
              }}
            ></div>
          </div>
        </div>

        {/* Milestones */}
        <div className="flex justify-between text-xs text-gray-500">
          <span className={displayStreak >= 3 ? config.textColor : 'text-gray-400'}>3连</span>
          <span className={displayStreak >= 5 ? config.textColor : 'text-gray-400'}>5连</span>
          <span className={displayStreak >= 10 ? config.textColor : 'text-gray-400'}>10连</span>
          <span className={displayStreak >= 20 ? config.textColor : 'text-gray-400'}>20连</span>
          <span className={displayStreak >= 50 ? config.textColor : 'text-gray-400'}>50连</span>
        </div>
      </div>

      {/* Streak Effect Animation */}
      <AnimatePresence>
        {showStreakEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className={`p-4 rounded-full bg-gradient-to-r ${config.color} shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo Text Animation */}
      <AnimatePresence>
        {showStreakEffect && displayStreak > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          >
            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-sm font-bold shadow-lg`}>
              {displayStreak} COMBO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}