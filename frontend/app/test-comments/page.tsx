"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SocialComment from '@/components/SocialComment'
import { MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  content: string
  image?: string
  likes: number
  dislikes: number
  createdAt: Date
  replyTo?: {
    id: string
    name: string
    avatar: string
  }
  isLiked?: boolean
  isDisliked?: boolean
}

export default function TestCommentsPage() {
  const [mainComment, setMainComment] = useState<Comment>({
    id: '1',
    author: {
      id: 'user1',
      name: '爱旅行的小明',
      avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop',
    },
    content: '能不能帮我找一下这个咖啡店的名片，老婆特别爱喝👍 这家店的咖啡真的超级好喝，环境也很不错！',
    likes: 15,
    dislikes: 0,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
    isLiked: false,
    isDisliked: false,
  })

  const [replies, setReplies] = useState<Comment[]>([
    {
      id: '2',
      author: {
        id: 'user2',
        name: '欧~小杰',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      replyTo: {
        id: 'user1',
        name: '爱旅行的小明',
        avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop',
      },
      content: '明天去讲价😁，今晚古城里看到49一袋，没买',
      likes: 8,
      dislikes: 1,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3小时前
      isLiked: false,
      isDisliked: false,
    },
    {
      id: '3',
      author: {
        id: 'user3',
        name: '心@所向',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop',
      },
      replyTo: {
        id: 'user2',
        name: '欧~小杰',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      content: '你买的也是100四袋吗？我也想买',
      likes: 3,
      dislikes: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      isLiked: false,
      isDisliked: false,
    },
    {
      id: '4',
      author: {
        id: 'user4',
        name: '甜甜26',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      },
      replyTo: {
        id: 'user1',
        name: '爱旅行的小明',
        avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop',
      },
      content: '这家店我也去过，咖啡确实不错！价格也很实惠',
      likes: 12,
      dislikes: 0,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
      isLiked: false,
      isDisliked: false,
    },
    {
      id: '5',
      author: {
        id: 'user5',
        name: '咖啡爱好者',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
      replyTo: {
        id: 'user4',
        name: '甜甜26',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      },
      content: '请问具体地址在哪里？想去试试',
      likes: 2,
      dislikes: 0,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
      isLiked: false,
      isDisliked: false,
    },
  ])

  const currentUser = {
    id: 'current-user',
    name: '我',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop',
  }

  const handleReply = (parentId: string, replyToUser: any, content: string, image?: string) => {
    const newReply: Comment = {
      id: Date.now().toString(),
      author: currentUser,
      replyTo: replyToUser,
      content,
      image,
      likes: 0,
      dislikes: 0,
      createdAt: new Date(),
      isLiked: false,
      isDisliked: false,
    }

    setReplies([...replies, newReply])
    toast.success('回复成功！')
  }

  const handleLike = (commentId: string, isMainComment: boolean) => {
    if (isMainComment) {
      setMainComment({
        ...mainComment,
        isLiked: !mainComment.isLiked,
        isDisliked: false,
        likes: mainComment.isLiked ? mainComment.likes - 1 : mainComment.likes + 1,
        dislikes: mainComment.isDisliked ? mainComment.dislikes - 1 : mainComment.dislikes,
      })
      toast.success(mainComment.isLiked ? '已取消点赞' : '点赞成功！')
    } else {
      setReplies(
        replies.map((r) => {
          if (r.id === commentId) {
            const wasLiked = r.isLiked
            return {
              ...r,
              isLiked: !wasLiked,
              isDisliked: false,
              likes: wasLiked ? r.likes - 1 : r.likes + 1,
              dislikes: r.isDisliked ? r.dislikes - 1 : r.dislikes,
            }
          }
          return r
        })
      )
      const reply = replies.find((r) => r.id === commentId)
      toast.success(reply?.isLiked ? '已取消点赞' : '点赞成功！')
    }
  }

  const handleDislike = (commentId: string, isMainComment: boolean) => {
    if (isMainComment) {
      setMainComment({
        ...mainComment,
        isDisliked: !mainComment.isDisliked,
        isLiked: false,
        dislikes: mainComment.isDisliked ? mainComment.dislikes - 1 : mainComment.dislikes + 1,
        likes: mainComment.isLiked ? mainComment.likes - 1 : mainComment.likes,
      })
      toast.success(mainComment.isDisliked ? '已取消踩' : '已踩')
    } else {
      setReplies(
        replies.map((r) => {
          if (r.id === commentId) {
            const wasDisliked = r.isDisliked
            return {
              ...r,
              isDisliked: !wasDisliked,
              isLiked: false,
              dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes + 1,
              likes: r.isLiked ? r.likes - 1 : r.likes,
            }
          }
          return r
        })
      )
      const reply = replies.find((r) => r.id === commentId)
      toast.success(reply?.isDisliked ? '已取消踩' : '已踩')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">评论系统测试</h1>
          <p className="text-gray-600">测试嵌套评论、点赞、回复等功能</p>
        </motion.div>

        {/* Test Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-xl shadow-sm p-4"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{1 + replies.length}</div>
              <div className="text-sm text-gray-600">总评论数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {mainComment.likes + replies.reduce((sum, r) => sum + r.likes, 0)}
              </div>
              <div className="text-sm text-gray-600">总点赞数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{replies.length}</div>
              <div className="text-sm text-gray-600">回复数</div>
            </div>
          </div>
        </motion.div>

        {/* Comment Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            评论区
          </h3>

          <SocialComment
            mainComment={mainComment}
            replies={replies}
            currentUser={currentUser}
            onReply={handleReply}
            onLike={handleLike}
            onDislike={handleDislike}
          />
        </motion.div>

        {/* Feature List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 rounded-xl p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-3">✅ 已实现功能：</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 主评论 + 子评论统一缩进</li>
            <li>• 显示 &quot;A 回复 B&quot; 关系</li>
            <li>• 点赞/踩功能（可收回）</li>
            <li>• 按点赞数自动排序</li>
            <li>• 上传图片功能</li>
            <li>• 加载更多评论</li>
            <li>• 嵌套回复输入框</li>
            <li>• 实时更新统计数据</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
