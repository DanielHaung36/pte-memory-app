'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export type AdPosition = 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup'

export interface AdData {
  id: string
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  backgroundColor?: string
  textColor?: string
  isExternal?: boolean
  priority?: number
}

interface AdBannerProps {
  position: AdPosition
  adData?: AdData
  className?: string
  closeable?: boolean
  autoClose?: number // 自动关闭时间（毫秒）
  onClose?: () => void
  onClick?: (ad: AdData) => void
}

// 默认广告数据（演示用）
const defaultAds: Record<AdPosition, AdData> = {
  top: {
    id: 'top-1',
    title: '🎓 限时优惠！PTE全科通关课程8折优惠',
    description: '专业外教指导，真题模拟，助你高分上岸',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    linkUrl: '/courses',
  },
  bottom: {
    id: 'bottom-1',
    title: '📚 海量PTE真题库等你来挑战',
    description: '每日更新，实时模拟考试环境',
    backgroundColor: '#8b5cf6',
    textColor: '#ffffff',
    linkUrl: '/questions',
  },
  sidebar: {
    id: 'sidebar-1',
    title: '💎 升级VIP会员',
    description: '解锁所有题型，享受无限练习',
    backgroundColor: '#f59e0b',
    textColor: '#ffffff',
    linkUrl: '/shop',
  },
  inline: {
    id: 'inline-1',
    title: '✨ 新用户专享福利',
    description: '注册即送100道精选题目',
    backgroundColor: '#10b981',
    textColor: '#ffffff',
    linkUrl: '/auth/register',
  },
  popup: {
    id: 'popup-1',
    title: '🔥 限时活动',
    description: '完成10道题目，赢取精美礼品',
    backgroundColor: '#ef4444',
    textColor: '#ffffff',
    linkUrl: '/activities',
  },
}

export default function AdBanner({
  position,
  adData,
  className = '',
  closeable = true,
  autoClose,
  onClose,
  onClick,
}: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isClosed, setIsClosed] = useState(false)

  const ad = adData || defaultAds[position]

  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoClose)

      return () => clearTimeout(timer)
    }
  }, [autoClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsClosed(true)
      onClose?.()
    }, 300)
  }

  const handleClick = () => {
    onClick?.(ad)
    if (ad.linkUrl) {
      if (ad.isExternal) {
        window.open(ad.linkUrl, '_blank')
      } else {
        window.location.href = ad.linkUrl
      }
    }
  }

  if (isClosed) return null

  const getLayoutStyles = () => {
    switch (position) {
      case 'top':
        return 'w-full py-3 px-4'
      case 'bottom':
        return 'w-full py-3 px-4'
      case 'sidebar':
        return 'w-full p-4'
      case 'inline':
        return 'w-full p-4 rounded-xl'
      case 'popup':
        return 'w-full max-w-md p-6 rounded-2xl shadow-2xl'
      default:
        return 'w-full p-4'
    }
  }

  const Container = position === 'popup' ? motion.div : 'div'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0, scale: position === 'popup' ? 0.9 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0, scale: position === 'popup' ? 0.9 : 1 }}
          transition={{ duration: 0.3 }}
          className={`relative ${getLayoutStyles()} ${className}`}
          style={{
            backgroundColor: ad.backgroundColor,
            color: ad.textColor,
          }}
        >
          <div className={`flex items-center ${position === 'popup' ? 'flex-col text-center' : 'justify-between'} gap-4`}>
            {/* 广告内容 */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm opacity-90">{ad.description}</p>
              )}
            </div>

            {/* 图片（如果有） */}
            {ad.imageUrl && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {ad.linkUrl && (
                <motion.button
                  type="button"
                  onClick={handleClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  了解详情
                  {ad.isExternal && <ExternalLink className="h-3 w-3" />}
                </motion.button>
              )}

              {closeable && (
                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="关闭广告"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Popup模式的背景遮罩 */}
          {position === 'popup' && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
              onClick={handleClose}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 多个广告轮播组件
interface AdCarouselProps {
  ads: AdData[]
  position: AdPosition
  interval?: number // 轮播间隔（毫秒）
  className?: string
}

export function AdCarousel({ ads, position, interval = 5000, className = '' }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (ads.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, interval)

    return () => clearInterval(timer)
  }, [ads.length, interval])

  if (ads.length === 0) return null

  return (
    <div className="relative">
      <AdBanner
        position={position}
        adData={ads[currentIndex]}
        className={className}
        closeable={false}
      />

      {/* 指示器 */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
