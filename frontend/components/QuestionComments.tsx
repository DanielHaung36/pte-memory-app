'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetCommentsByQuestionQuery,
  useCreateCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  usePinCommentMutation,
  useDeleteCommentMutation,
  Comment,
} from '@/lib/store/commentsApi';
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface QuestionCommentsProps {
  questionId: string;
  currentUserId?: string;
}

export default function QuestionComments({ questionId, currentUserId }: QuestionCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'text' | 'note'>('text');
  const [noteTitle, setNoteTitle] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetCommentsByQuestionQuery({ questionId });
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [likeComment] = useLikeCommentMutation();
  const [unlikeComment] = useUnlikeCommentMutation();
  const [pinComment] = usePinCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment({
        question_id: questionId,
        parent_id: replyingTo || undefined,
        comment_type: commentType,
        content: newComment,
        note_title: commentType === 'note' ? noteTitle : undefined,
        is_private: false,
      }).unwrap();

      setNewComment('');
      setNoteTitle('');
      setReplyingTo(null);
      refetch();
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('评论发布失败');
    }
  };

  const handleLike = async (commentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeComment(commentId).unwrap();
      } else {
        await likeComment(commentId).unwrap();
      }
      refetch();
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
    }
  };

  const handlePin = async (commentId: string) => {
    try {
      await pinComment(commentId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to pin comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await deleteComment(commentId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('删除失败');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const comments = data?.comments || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <ChatBubbleLeftIcon className="w-6 h-6 mr-2 text-indigo-600" />
          评论 ({comments.length})
        </h3>
      </div>

      {/* 评论输入框 */}
      <div className="mb-8">
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => setCommentType('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              commentType === 'text'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
            文字评论
          </button>
          <button
            onClick={() => setCommentType('note')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              commentType === 'note'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-1" />
            学习笔记
          </button>
        </div>

        {commentType === 'note' && (
          <input
            type="text"
            placeholder="笔记标题"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}

        {replyingTo && (
          <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            正在回复评论
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-indigo-600 hover:text-indigo-800"
            >
              取消
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              commentType === 'note'
                ? '记录你的学习心得和理解...'
                : replyingTo
                ? '写下你的回复...'
                : '分享你的想法、音频练习或笔记...'
            }
            rows={4}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isCreating}
            className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onLike={handleLike}
              onPin={handlePin}
              onDelete={handleDelete}
              onReply={(id) => setReplyingTo(id)}
            />
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>还没有评论，来发表第一条评论吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onLike: (id: string, isLiked: boolean) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  onPin,
  onDelete,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false);

  const isAuthor = currentUserId === comment.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${isReply ? 'ml-12' : ''} ${
        comment.is_pinned ? 'border-l-4 border-indigo-600 bg-indigo-50' : ''
      } p-4 rounded-lg border border-gray-200`}
    >
      {/* 用户信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {comment.user?.username || '匿名用户'}
              </span>
              {comment.user?.level && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Lv.{comment.user.level}
                </span>
              )}
              {comment.is_pinned && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  置顶
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        {isAuthor && (
          <div className="flex space-x-2">
            <button
              onClick={() => onDelete(comment.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="删除"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 评论内容 */}
      {comment.comment_type === 'note' && comment.note_title && (
        <div className="mb-2">
          <div className="flex items-center text-indigo-600 font-semibold">
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            {comment.note_title}
          </div>
        </div>
      )}

      <div className="text-gray-800 mb-3 whitespace-pre-wrap">{comment.content}</div>

      {comment.audio_url && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
          <MicrophoneIcon className="w-5 h-5 text-gray-600" />
          <audio controls className="flex-1">
            <source src={comment.audio_url} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* 互动按钮 */}
      <div className="flex items-center space-x-4 text-sm">
        <button
          onClick={() => {
            setIsLiked(!isLiked);
            onLike(comment.id, isLiked);
          }}
          className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
        >
          {isLiked ? (
            <HeartSolidIcon className="w-5 h-5 text-red-600" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
          <span>{comment.like_count}</span>
        </button>

        <button
          onClick={() => onReply(comment.id)}
          className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          <span>回复 ({comment.reply_count})</span>
        </button>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onLike={onLike}
              onPin={onPin}
              onDelete={onDelete}
              onReply={onReply}
              isReply={true}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
