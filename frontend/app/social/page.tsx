"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Star,
  TrendingUp,
  Plus,
  Camera,
  Image as ImageIcon,
  Smile,
  Send,
  MoreVertical,
  ThumbsUp,
  Award,
  Zap,
  Users,
  Calendar,
  Filter,
  Bookmark,
  Flag,
  Edit,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AppNavigation from '@/components/ui/navigation/AppNavigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import {
  useGetPublicFeedQuery,
  useGetFeedQuery,
  useLikePostMutation,
  useBookmarkPostMutation,
  useCreatePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useLikeCommentMutation,
  useDislikeCommentMutation,
  socialUtils,
  type PostWithStatus,
  type CreatePostRequest,
  type Comment
} from '@/lib/store/socialApi';
import { useSmartAlert } from '@/components/ui/SmartAlert';
import SocialComment from '@/components/SocialComment';


const feedFilters = ['全部', '好友', '成就', '学习笔记', '技巧分享', '里程碑'];
const postTypes = ['study_session', 'achievement', 'tip', 'question', 'celebration'];

// Post Comments Component
function PostComments({ postId }: { postId: string }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { success, error } = useSmartAlert();
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImage, setNewCommentImage] = useState<string>();
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3); // 初始显示3条主评论

  const { data: commentsData, refetch: refetchComments } = useGetCommentsQuery(postId);
  const [createComment] = useCreateCommentMutation();
  const [likeComment] = useLikeCommentMutation();
  const [dislikeComment] = useDislikeCommentMutation();

  const allComments = commentsData?.comments || [];

  // Get all main comments (comments without parent_id)
  const allMainComments = allComments.filter((c) => !c.parent_id);

  // Sort main comments by creation time (newest first)
  const sortedMainComments = [...allMainComments].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Visible main comments (paginated)
  const visibleMainComments = sortedMainComments.slice(0, visibleCommentsCount);

  // Check if there are more comments to load
  const hasMoreComments = sortedMainComments.length > visibleCommentsCount;

  // Function to get replies for a specific comment
  const getRepliesForComment = (commentId: string) => {
    return allComments.filter((c) => c.parent_id === commentId);
  };

  // Load more comments
  const handleLoadMore = () => {
    setVisibleCommentsCount(prev => prev + 3);
  };

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
      };

  const handleCreateMainComment = async () => {
    if (!user) {
      error('请先登录');
      return;
    }

    if (!newCommentText.trim() && !newCommentImage) {
      error('请输入评论内容');
      return;
    }

    try {
      await createComment({
        postId,
        data: {
          content: newCommentText.trim(),
          images: newCommentImage ? [newCommentImage] : undefined,
        },
      }).unwrap();

      setNewCommentText('');
      setNewCommentImage(undefined);
      refetchComments();
      success('评论成功！');
    } catch (err) {
      error('评论失败，请重试');
    }
  };

  const handleReply = async (parentId: string, replyToUser: any, content: string, image?: string) => {
    if (!user) {
      error('请先登录');
      return;
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
      }).unwrap();

      refetchComments();
      success('回复成功！');
    } catch (err) {
      error('回复失败，请重试');
    }
  };

  const handleLike = async (commentId: string, isMainComment: boolean) => {
    if (!user) {
      error('请先登录');
      return;
    }

    try {
      await likeComment({ postId, commentId }).unwrap();
      refetchComments();
    } catch (err) {
      error('操作失败');
    }
  };

  const handleDislike = async (commentId: string, isMainComment: boolean) => {
    if (!user) {
      error('请先登录');
      return;
    }

    try {
      await dislikeComment({ postId, commentId }).unwrap();
      refetchComments();
    } catch (err) {
      error('操作失败');
    }
  };

  return (
    <div className="p-6">
      {/* Create comment input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
          <div className="flex-1">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="写下你的评论..."
              className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            {newCommentImage && (
              <div className="mt-2 relative inline-block">
                <img src={newCommentImage} alt="preview" className="rounded-lg max-h-32 object-cover" />
                <button
                  onClick={() => setNewCommentImage(undefined)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <label className="cursor-pointer flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <ImageIcon className="w-4 h-4" />
                图片
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setNewCommentImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <button
                onClick={handleCreateMainComment}
                disabled={!newCommentText.trim() && !newCommentImage}
                className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                发表
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing comments */}
      {allMainComments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">还没有评论，来抢沙发吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleMainComments.map((mainComment) => {
            const replies = getRepliesForComment(mainComment.id);
            return (
              <SocialComment
                key={mainComment.id}
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
            );
          })}

          {/* Load More Button */}
          {hasMoreComments && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                加载更多评论 ({sortedMainComments.length - visibleCommentsCount} 条)
              </button>
            </div>
          )}

          {/* Total count indicator */}
          {allMainComments.length > 0 && (
            <div className="text-center text-xs text-gray-500 py-2">
              已显示 {visibleMainComments.length} / {allMainComments.length} 条评论
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SocialFeedPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [newPost, setNewPost] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [postType, setPostType] = useState<'study_session' | 'tip' | 'question' | 'celebration'>('study_session');
  const [postImages, setPostImages] = useState<string[]>([]);

  const { success, error } = useSmartAlert();

  // Compute filter type
  const filterType = React.useMemo(() => {
    const filterMap: Record<string, string> = {
      '成就': 'achievement',
      '学习笔记': 'study_session',
      '技巧分享': 'tip',
      '里程碑': 'milestone'
    };
    return selectedFilter === '全部' ? 'all' : (filterMap[selectedFilter] || 'all');
  }, [selectedFilter]);

  // API Hooks - must be called in the same order every render
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetFeedQuery(
    { limit: 20, offset: 0 },
    { skip: !user }
  );

  const { data: publicFeedData, isLoading: publicFeedLoading, refetch: refetchPublic } = useGetPublicFeedQuery({
    limit: 20,
    offset: 0,
    type: filterType
  });

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [createPost] = useCreatePostMutation();
  
  // Get posts based on user login status and filter
  const posts = React.useMemo(() => {
    if (user && selectedFilter === '好友') {
      return feedData?.posts || [];
    }
    return publicFeedData?.posts || [];
  }, [user, selectedFilter, feedData, publicFeedData]);

  const isLoading = user && selectedFilter === '好友' ? feedLoading : publicFeedLoading;

  const handleLike = async (postId: string) => {
    if (!user) {
      error('请先登录才能点赞');
      return;
    }
    
    try {
      await likePost(postId).unwrap();
      // Refresh feeds to update like status
      if (selectedFilter === '好友') {
        refetchFeed();
      } else {
        refetchPublic();
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) {
      error('请先登录才能收藏');
      return;
    }
    
    try {
      const result = await bookmarkPost(postId).unwrap();
      success(result.message);
      // Refresh feeds to update bookmark status
      if (selectedFilter === '好友') {
        refetchFeed();
      } else {
        refetchPublic();
      }
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPostImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!user) {
      error('请先登录才能发布动态');
      return;
    }

    if (!newPost.trim() && postImages.length === 0) {
      error('请输入内容或上传图片');
      return;
    }

    try {
      const postData: CreatePostRequest = {
        content: newPost.trim(),
        post_type: postType,
        privacy: 'public',
        tags: [],
        images: postImages,
      };

      await createPost(postData).unwrap();
      success('动态发布成功！');
      setNewPost('');
      setPostImages([]);
      setShowPostModal(false);

      // Refresh feeds
      if (selectedFilter === '好友') {
        refetchFeed();
      } else {
        refetchPublic();
      }
    } catch (error) {
      console.error('发布失败:', error);
      error('发布失败，请重试');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              学习动态
            </h1>
          </motion.div>
          
          <p className="text-gray-600 mb-6">
            分享学习成果，记录成长足迹，与同伴交流心得
          </p>
        </div>

        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div className="flex-1">
              <button
                onClick={() => setShowPostModal(true)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-500 transition-colors"
              >
                分享今天的学习成果...
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPostModal(true)}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-100">
            <div className="flex space-x-1 overflow-x-auto">
              {feedFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedFilter === filter
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((postWithStatus, index) => {
            const post = postWithStatus.post;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Post Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {post.user.username[0].toUpperCase()}
                          </span>
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs font-bold text-white">
                            {post.user.level}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {post.user.username}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{socialUtils.getPostTypeIcon(post.post_type)}</span>
                          <span>{socialUtils.getPostTypeText(post.post_type)}</span>
                          <span>•</span>
                          <span>{socialUtils.formatTimeAgo(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-6">
                  <p className="text-gray-800 mb-4 leading-relaxed">
                    {post.content}
                  </p>

                  {/* Study Data */}
                  {post.study_data && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <BookOpen className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="font-bold text-blue-600">{post.study_data.questions_completed}</span>
                          </div>
                          <div className="text-xs text-gray-600">题目完成</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Target className="h-4 w-4 text-green-500 mr-1" />
                            <span className="font-bold text-green-600">{Math.round(post.study_data.accuracy)}%</span>
                          </div>
                          <div className="text-xs text-gray-600">准确率</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Clock className="h-4 w-4 text-orange-500 mr-1" />
                            <span className="font-bold text-orange-600">{socialUtils.formatStudyTime(post.study_data.time_spent)}</span>
                          </div>
                          <div className="text-xs text-gray-600">学习时间</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="h-4 w-4 text-purple-500 mr-1" />
                            <span className="font-bold text-purple-600 text-sm">{post.study_data.subject}</span>
                          </div>
                          <div className="text-xs text-gray-600">学习科目</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Achievement */}
                  {post.achievement_data && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-4">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-bold text-yellow-800">{post.achievement_data.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${socialUtils.getAchievementRarityColor(post.achievement_data.rarity)}`}>
                              {post.achievement_data.rarity}
                            </span>
                          </div>
                          <p className="text-yellow-700 text-sm">{post.achievement_data.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          postWithStatus.is_liked
                            ? 'bg-red-50 text-red-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${postWithStatus.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likes_count}</span>
                      </motion.button>
                      
                      <button
                        onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.comments_count}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Share className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.shares_count}</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        postWithStatus.is_bookmarked
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${postWithStatus.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {showComments === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-100 bg-gray-50/50"
                    >
                      <PostComments postId={post.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无学习动态
            </h3>
            <p className="text-gray-600 mb-6">
              开始学习或关注更多朋友来查看动态
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPostModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>发布动态</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowPostModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  发布学习动态
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Post Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  动态类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'study_session', label: '学习记录', icon: '📚' },
                    { key: 'achievement', label: '获得成就', icon: '🏆' },
                    { key: 'tip', label: '分享技巧', icon: '⭐' },
                    { key: 'celebration', label: '庆祝时刻', icon: '🎉' }
                  ].map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setPostType(type.key as typeof postType)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        postType === type.key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分享内容
                </label>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="分享今天的学习成果、心得或感悟..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图片（可选）
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {postImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`上传图片 ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {postImages.length < 4 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Camera className="h-6 w-6 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">最多上传4张图片</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() && postImages.length === 0}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发布
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}