'use client'

import { motion } from "framer-motion"
import { Star, Sparkles } from "lucide-react"

interface LevelProgressProps {
  level: number
  xp: number
}

export function LevelProgress({ level, xp }: LevelProgressProps) {
  const nextLevelXp = (level * 1000)
  const currentLevelXp = ((level - 1) * 1000)
  const progress = Math.max(0, Math.min(100, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
  
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
        >
          {level}
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Level {level}</span>
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
        </div>
        <div className="w-24 bg-gray-200 rounded-full h-2 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"
          />
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </div>
        <span className="text-xs text-gray-500 mt-1">
          {xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
        </span>
      </div>
    </div>
  )
}