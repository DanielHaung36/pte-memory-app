"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Image as ImageIcon, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface User {
  id: string
  name: string
  avatar: string
}

interface Comment {
  id: string
  author: User
  content: string
  image?: string
  likes: number
  dislikes: number
  createdAt: Date
  replyTo?: User
  isLiked?: boolean
  isDisliked?: boolean
}

interface SocialCommentProps {
  mainComment: Comment
  replies: Comment[]
  currentUser: User
  onReply: (parentId: string, replyToUser: User, content: string, image?: string) => void
  onLike: (commentId: string, isMainComment: boolean) => void
  onDislike: (commentId: string, isMainComment: boolean) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}`}
      alt={alt}
      className="w-9 h-9 rounded-full object-cover border border-gray-200"
    />
  )
}

function Meta({ text }: { text: string }) {
  return <span className="text-xs text-gray-500">{text}</span>
}

function CommentInput({
  placeholder,
  replyToUser,
  onSubmit,
  onCancel,
}: {
  placeholder: string
  replyToUser?: User
  onSubmit: (text: string, image?: string) => void
  onCancel?: () => void
}) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | undefined>()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!text.trim() && !image) return
    onSubmit(text.trim(), image)
    setText('')
    setImage(undefined)
    onCancel?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 mt-2"
    >
      {replyToUser && (
        <div className="text-xs text-blue-600 mb-2">回复 @{replyToUser.name}</div>
      )}

      {image && (
        <div className="mb-2 relative inline-block">
          <img src={image} alt="preview" className="rounded-lg max-h-40 object-cover" />
          <button
            onClick={() => setImage(undefined)}
            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={2}
      />

      <div className="flex justify-between items-center mt-2">
        <label className="cursor-pointer flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ImageIcon className="w-4 h-4" />
          上传图片
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!text.trim() && !image}
          >
            <Send className="w-3.5 h-3.5" />
            发表
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ReplyItem({
  reply,
  onReplySubmit,
  onLike,
  onDislike,
}: {
  reply: Comment
  onReplySubmit: (replyTo: User, text: string, image?: string) => void
  onLike: (id: string) => void
  onDislike: (id: string) => void
}) {
  const [isReplying, setIsReplying] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <Avatar src={reply.author.avatar} alt={reply.author.name} />
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="font-medium mr-1">{reply.author.name}</span>
            {reply.replyTo && (
              <>
                <span className="text-gray-500">reply</span>
                <span className="font-medium ml-1">{reply.replyTo.name}</span>
              </>
            )}
          </div>
          <div className="mt-1 text-sm leading-6 text-gray-800 whitespace-pre-wrap break-words">
            {reply.content}
          </div>
          {reply.image && (
            <img
              src={reply.image}
              alt="reply-img"
              className="mt-2 rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90"
            />
          )}
          <div className="mt-2 flex items-center gap-4">
            <Meta text={formatDistanceToNow(reply.createdAt, { locale: zhCN, addSuffix: true })} />
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              回复
            </button>
            <button
              onClick={() => onLike(reply.id)}
              className={`text-xs flex items-center gap-1 transition-colors ${
                reply.isLiked
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${reply.isLiked ? 'fill-current' : ''}`} />
              {reply.likes > 0 && reply.likes}
            </button>
            <button
              onClick={() => onDislike(reply.id)}
              className={`text-xs flex items-center gap-1 transition-colors ${
                reply.isDisliked
                  ? 'text-red-600 font-medium'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${reply.isDisliked ? 'fill-current' : ''}`} />
              {reply.dislikes > 0 && reply.dislikes}
            </button>
          </div>
          <AnimatePresence>
            {isReplying && (
              <CommentInput
                placeholder={`回复 @${reply.author.name}...`}
                replyToUser={reply.author}
                onSubmit={(text, image) => {
                  onReplySubmit(reply.author, text, image)
                  setIsReplying(false)
                }}
                onCancel={() => setIsReplying(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function SocialComment({
  mainComment,
  replies,
  currentUser,
  onReply,
  onLike,
  onDislike,
  onLoadMore,
  hasMore = false,
}: SocialCommentProps) {
  const [visibleCount, setVisibleCount] = useState(5)
  const [isReplyingToMain, setIsReplyingToMain] = useState(false)

  // Sort replies by likes
  const sortedReplies = [...replies].sort((a, b) => b.likes - a.likes)
  const visibleReplies = sortedReplies.slice(0, visibleCount)

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5)
    if (visibleCount >= sortedReplies.length && onLoadMore) {
      onLoadMore()
    }
  }

  return (
    <div className="space-y-4">
      {/* 主评论 */}
      <div className="flex gap-3">
        <Avatar src={mainComment.author.avatar} alt={mainComment.author.name} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>{mainComment.author.name}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onLike(mainComment.id, true)}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  mainComment.isLiked
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${mainComment.isLiked ? 'fill-current' : ''}`} />
                {mainComment.likes > 0 && mainComment.likes}
              </button>
              <button
                onClick={() => onDislike(mainComment.id, true)}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  mainComment.isDisliked
                    ? 'text-red-600 font-medium'
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${mainComment.isDisliked ? 'fill-current' : ''}`} />
                {mainComment.dislikes > 0 && mainComment.dislikes}
              </button>
            </div>
          </div>
          <div className="mt-1 text-sm leading-6 text-gray-800 whitespace-pre-wrap break-words">
            {mainComment.content}
          </div>
          {mainComment.image && (
            <img
              src={mainComment.image}
              alt="main-comment-img"
              className="mt-2 rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90"
            />
          )}
          <div className="mt-2 flex items-center gap-3">
            <Meta
              text={formatDistanceToNow(mainComment.createdAt, {
                locale: zhCN,
                addSuffix: true,
              })}
            />
            <button
              onClick={() => setIsReplyingToMain(!isReplyingToMain)}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              回复
            </button>
          </div>
          <AnimatePresence>
            {isReplyingToMain && (
              <CommentInput
                placeholder={`回复 @${mainComment.author.name}...`}
                replyToUser={mainComment.author}
                onSubmit={(text, image) => {
                  onReply(mainComment.id, mainComment.author, text, image)
                  setIsReplyingToMain(false)
                }}
                onCancel={() => setIsReplyingToMain(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 子评论列表（统一缩进） */}
      {visibleReplies.length > 0 && (
        <div className="ml-12 space-y-4 border-l-2 border-gray-100 pl-4">
          {visibleReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onReplySubmit={(replyTo, text, image) =>
                onReply(mainComment.id, replyTo, text, image)
              }
              onLike={(id) => onLike(id, false)}
              onDislike={(id) => onDislike(id, false)}
            />
          ))}

          {/* 加载更多按钮 */}
          {(visibleCount < sortedReplies.length || hasMore) && (
            <button
              onClick={handleLoadMore}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              加载更多评论 ({sortedReplies.length - visibleCount > 0 ? `还有 ${sortedReplies.length - visibleCount} 条` : '...'})
            </button>
          )}
        </div>
      )}

      {/* 没有回复时的提示 */}
      {replies.length === 0 && (
        <div className="ml-12 text-sm text-gray-400 italic">暂无回复</div>
      )}
    </div>
  )
}
