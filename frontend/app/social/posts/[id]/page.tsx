"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Target,
  Award,
} from 'lucide-react'
import AppNavigation from '@/components/ui/navigation/AppNavigation'
import SocialComment from '@/components/SocialComment'
import {
  useGetPublicFeedQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useLikePostMutation,
  useBookmarkPostMutation,
  useLikeCommentMutation,
  useDislikeCommentMutation,
  type Comment,
} from '@/lib/store/socialApi'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const user = useSelector((state: RootState) => state.auth.user)

  // API hooks
  const { data: feedData } = useGetPublicFeedQuery({ limit: 50 })
  const { data: commentsData, refetch: refetchComments } = useGetCommentsQuery(postId)
  const [createComment] = useCreateCommentMutation()
  const [likePost] = useLikePostMutation()
  const [bookmarkPost] = useBookmarkPostMutation()
  const [likeComment] = useLikeCommentMutation()
  const [dislikeComment] = useDislikeCommentMutation()

  // Find the specific post
  const postWithStatus = feedData?.posts?.find((p) => p.post.id === postId)
  const post = postWithStatus?.post

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  // Extract main comment and replies
  const allComments = commentsData?.comments || []
  const mainComment = allComments.find((c) => !c.parent_id)
  const replies = allComments.filter((c) => c.parent_id === mainComment?.id)

  const currentUser = user
    ? {
        id: user.id,
        name: user.username,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}`,
      }
    : {
        id: 'guest',
        name: '游客',
        avatar: 'https://ui-avatars.com/api/?name=Guest',
      }

  const handleReply = async (parentId: string, replyToUser: any, content: string, image?: string) => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await createComment({
        postId,
        data: {
          content,
          parent_id: parentId,
          reply_to_user_id: replyToUser.id,
          images: image ? [image] : undefined,
        },
      }).unwrap()

      refetchComments()
      toast.success('回复成功！')
    } catch (error) {
      toast.error('回复失败，请重试')
    }
  }

  const handleLike = async (commentId: string, isMainComment: boolean) => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await likeComment({ postId, commentId }).unwrap()
      refetchComments()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDislike = async (commentId: string, isMainComment: boolean) => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await dislikeComment({ postId, commentId }).unwrap()
      refetchComments()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleLikePost = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await likePost(postId).unwrap()
      toast.success(postWithStatus?.is_liked ? '已取消点赞' : '点赞成功！')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await bookmarkPost(postId).unwrap()
      toast.success(postWithStatus?.is_bookmarked ? '已取消收藏' : '收藏成功！')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-600" />
      case 'milestone':
        return <Target className="w-5 h-5 text-purple-600" />
      case 'study_session':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      default:
        return <MessageCircle className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppNavigation />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">动态详情</h1>
        </div>

        {/* Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={post.user.avatar || `https://ui-avatars.com/api/?name=${post.user.username}`}
                alt={post.user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-medium text-gray-900">{post.user.username}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {getPostTypeIcon(post.post_type)}
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    locale: zhCN,
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Post Content */}
          {post.title && <h2 className="text-xl font-semibold mb-3">{post.title}</h2>}
          <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</div>

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className="rounded-lg w-full object-cover cursor-pointer hover:opacity-90"
                />
              ))}
            </div>
          )}

          {/* Study Data */}
          {post.study_data && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{post.study_data.questions_completed}</div>
                  <div className="text-sm text-gray-600">完成题数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{post.study_data.accuracy}%</div>
                  <div className="text-sm text-gray-600">正确率</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{post.study_data.time_spent}min</div>
                  <div className="text-sm text-gray-600">学习时长</div>
                </div>
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t">
            <button
              onClick={handleLikePost}
              className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
                postWithStatus?.is_liked ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${postWithStatus?.is_liked ? 'fill-current' : ''}`} />
              {post.likes_count > 0 && post.likes_count}
            </button>

            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              {post.comments_count > 0 && post.comments_count}
            </div>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 hover:text-yellow-500 transition-colors ${
                postWithStatus?.is_bookmarked ? 'text-yellow-500' : 'text-gray-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${postWithStatus?.is_bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            评论 ({allComments.length})
          </h3>

          {mainComment && (
            <SocialComment
              mainComment={{
                id: mainComment.id,
                author: {
                  id: mainComment.user.id,
                  name: mainComment.user.username,
                  avatar: mainComment.user.avatar || `https://ui-avatars.com/api/?name=${mainComment.user.username}`,
                },
                content: mainComment.content,
                image: mainComment.images?.[0],
                likes: mainComment.likes_count || 0,
                dislikes: mainComment.dislikes_count || 0,
                createdAt: new Date(mainComment.created_at),
                isLiked: mainComment.is_liked,
                isDisliked: mainComment.is_disliked,
              }}
              replies={replies.map((r) => ({
                id: r.id,
                author: {
                  id: r.user.id,
                  name: r.user.username,
                  avatar: r.user.avatar || `https://ui-avatars.com/api/?name=${r.user.username}`,
                },
                replyTo: r.reply_to_user
                  ? {
                      id: r.reply_to_user.id,
                      name: r.reply_to_user.username,
                      avatar: r.reply_to_user.avatar || `https://ui-avatars.com/api/?name=${r.reply_to_user.username}`,
                    }
                  : undefined,
                content: r.content,
                image: r.images?.[0],
                likes: r.likes_count || 0,
                dislikes: r.dislikes_count || 0,
                createdAt: new Date(r.created_at),
                isLiked: r.is_liked,
                isDisliked: r.is_disliked,
              }))}
              currentUser={currentUser}
              onReply={handleReply}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          )}

          {allComments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">还没有评论，来抢沙发吧！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
