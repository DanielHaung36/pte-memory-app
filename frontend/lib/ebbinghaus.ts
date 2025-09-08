// 艾宾浩斯遗忘曲线算法 (前端版本用于UI显示和计算)

export interface ReviewResult {
  isCorrect: boolean
  confidenceLevel: number // 1-5 scale
  responseTime?: number // milliseconds
  streakCount?: number
}

export interface ReviewSchedule {
  currentInterval: number // days
  easeFactor: number // 1.3 - 2.5+
  repetitionCount: number
  nextReviewDate: Date
  isCompleted: boolean
}

export interface StreakInfo {
  current: number
  best: number
  multiplier: number
}

/**
 * 计算连击奖励倍数
 */
export function getStreakMultiplier(streakCount: number): number {
  if (streakCount < 3) return 1
  if (streakCount < 5) return 1.2
  if (streakCount < 10) return 1.5
  if (streakCount < 20) return 2
  return 2.5
}

/**
 * 计算连击等级和名称
 */
export function getStreakLevel(streakCount: number): { level: number; name: string; color: string } {
  if (streakCount < 3) return { level: 0, name: '起步', color: 'gray' }
  if (streakCount < 5) return { level: 1, name: '入门', color: 'blue' }
  if (streakCount < 10) return { level: 2, name: '进步', color: 'green' }
  if (streakCount < 20) return { level: 3, name: '优秀', color: 'purple' }
  if (streakCount < 50) return { level: 4, name: '专家', color: 'orange' }
  return { level: 5, name: '大师', color: 'red' }
}

/**
 * 艾宾浩斯标准复习间隔
 */
export const EBBINGHAUS_INTERVALS = [
  { days: 1, label: '1天后' },
  { days: 2, label: '2天后' },
  { days: 4, label: '4天后' },
  { days: 7, label: '1周后' },
  { days: 15, label: '2周后' },
  { days: 30, label: '1个月后' },
  { days: 60, label: '2个月后' },
  { days: 120, label: '4个月后' },
] as const

/**
 * 计算题目掌握程度
 */
export function getMasteryLevel(schedule: ReviewSchedule): { level: number; label: string; percentage: number } {
  const { repetitionCount, currentInterval, easeFactor } = schedule
  
  let percentage = 0
  let level = 0
  let label = '新题目'
  
  if (repetitionCount >= 8 && currentInterval >= 60) {
    percentage = 100
    level = 5
    label = '完全掌握'
  } else if (repetitionCount >= 6 && currentInterval >= 30) {
    percentage = 85
    level = 4
    label = '熟练掌握'
  } else if (repetitionCount >= 4 && currentInterval >= 15) {
    percentage = 70
    level = 3
    label = '基本掌握'
  } else if (repetitionCount >= 2 && currentInterval >= 4) {
    percentage = 50
    level = 2
    label = '初步掌握'
  } else if (repetitionCount >= 1) {
    percentage = 25
    level = 1
    label = '正在学习'
  }
  
  return { level, label, percentage }
}

/**
 * 计算记忆强度 (用于优先级排序)
 */
export function getMemoryStrength(daysSinceLastReview: number, schedule: ReviewSchedule): number {
  const { easeFactor, currentInterval } = schedule
  
  // 使用指数衰减函数模拟遗忘曲线
  const decayRate = 1 / (easeFactor * 2)
  const strength = Math.exp(-daysSinceLastReview * decayRate)
  
  return Math.max(0, Math.min(1, strength))
}

/**
 * 获取复习紧急程度
 */
export function getReviewUrgency(schedule: ReviewSchedule, daysSinceLastReview: number): {
  level: number
  label: string
  color: string
} {
  const overdueDays = daysSinceLastReview - schedule.currentInterval
  
  if (overdueDays > 7) {
    return { level: 4, label: '严重超期', color: 'red' }
  } else if (overdueDays > 3) {
    return { level: 3, label: '超期', color: 'orange' }
  } else if (overdueDays > 0) {
    return { level: 2, label: '需要复习', color: 'yellow' }
  } else if (overdueDays > -1) {
    return { level: 1, label: '即将到期', color: 'blue' }
  } else {
    return { level: 0, label: '未到期', color: 'green' }
  }
}

/**
 * 预测下次复习时间
 */
export function predictNextInterval(schedule: ReviewSchedule, isCorrect: boolean): number {
  if (!isCorrect) return 1
  
  const { currentInterval, easeFactor, repetitionCount } = schedule
  
  if (repetitionCount === 0) return 1
  if (repetitionCount === 1) return 2
  if (repetitionCount === 2) return 4
  
  return Math.ceil(currentInterval * easeFactor)
}