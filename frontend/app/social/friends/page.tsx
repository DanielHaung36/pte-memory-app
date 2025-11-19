"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  MessageCircle,
  TrendingUp,
  Trophy,
  Target,
  Clock,
  Star,
  Heart,
  MoreVertical,
  UserCheck,
  UserMinus,
  Calendar,
  Activity,
  Award,
  Zap,
  BookOpen,
  Filter
} from 'lucide-react';
import AppNavigation from '@/components/ui/navigation/AppNavigation';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  studyStreak: number;
  todayStudied: number;
  weeklyGoal: number;
  weeklyProgress: number;
  lastOnline: string;
  status: 'online' | 'offline' | 'studying';
  badges: string[];
  relationship: 'friend' | 'following' | 'follower' | 'mutual';
  joinedDate: string;
  commonInterests: string[];
}

const mockFriends: Friend[] = [
  {
    id: '1',
    username: '李明',
    level: 5,
    xp: 2850,
    studyStreak: 12,
    todayStudied: 25,
    weeklyGoal: 100,
    weeklyProgress: 78,
    lastOnline: '2025-01-10T10:30:00',
    status: 'studying',
    badges: ['streak_master', 'accuracy_pro', 'early_bird'],
    relationship: 'friend',
    joinedDate: '2024-12-15',
    commonInterests: ['PTE', 'Speaking', '口语练习']
  },
  {
    id: '2',
    username: 'Sarah Chen',
    level: 7,
    xp: 4200,
    studyStreak: 28,
    todayStudied: 42,
    weeklyGoal: 120,
    weeklyProgress: 95,
    lastOnline: '2025-01-10T09:15:00',
    status: 'online',
    badges: ['legend', 'writing_expert', 'mentor'],
    relationship: 'friend',
    joinedDate: '2024-11-20',
    commonInterests: ['IELTS', 'Writing', 'Academic']
  },
  {
    id: '3',
    username: '王小华',
    level: 3,
    xp: 1250,
    studyStreak: 5,
    todayStudied: 0,
    weeklyGoal: 60,
    weeklyProgress: 40,
    lastOnline: '2025-01-09T20:45:00',
    status: 'offline',
    badges: ['consistent', 'grammar_guru'],
    relationship: 'following',
    joinedDate: '2025-01-01',
    commonInterests: ['基础英语', '语法']
  },
  {
    id: '4',
    username: 'Alex Johnson',
    level: 6,
    xp: 3600,
    studyStreak: 20,
    todayStudied: 30,
    weeklyGoal: 80,
    weeklyProgress: 85,
    lastOnline: '2025-01-10T08:20:00',
    status: 'online',
    badges: ['speaking_star', 'practice_hero'],
    relationship: 'mutual',
    joinedDate: '2024-10-30',
    commonInterests: ['Business English', 'Speaking']
  }
];

const relationshipFilters = ['全部', '好友', '关注中', '粉丝', '互关'];
const statusFilters = ['全部', '在线', '学习中', '离线'];

export default function FriendsPage() {
  const [friends] = useState<Friend[]>(mockFriends);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [activeTab, setActiveTab] = useState<'friends' | 'discover' | 'leaderboard'>('friends');

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         friend.commonInterests.some(interest => 
                           interest.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesRelationship = relationshipFilter === '全部' || 
      (relationshipFilter === '好友' && friend.relationship === 'friend') ||
      (relationshipFilter === '关注中' && friend.relationship === 'following') ||
      (relationshipFilter === '粉丝' && friend.relationship === 'follower') ||
      (relationshipFilter === '互关' && friend.relationship === 'mutual');
    
    const matchesStatus = statusFilter === '全部' ||
      (statusFilter === '在线' && friend.status === 'online') ||
      (statusFilter === '学习中' && friend.status === 'studying') ||
      (statusFilter === '离线' && friend.status === 'offline');
    
    return matchesSearch && matchesRelationship && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'studying': return 'bg-blue-500 animate-pulse';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'studying': return '学习中';
      case 'offline': return '离线';
      default: return '';
    }
  };

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case 'friend': return '好友';
      case 'following': return '关注中';
      case 'follower': return '粉丝';
      case 'mutual': return '互相关注';
      default: return '';
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'friend': return 'bg-green-100 text-green-700';
      case 'following': return 'bg-blue-100 text-blue-700';
      case 'follower': return 'bg-purple-100 text-purple-700';
      case 'mutual': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatLastOnline = (lastOnline: string) => {
    const date = new Date(lastOnline);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚在线';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              学习好友
            </h1>
          </motion.div>
          
          <p className="text-gray-600 mb-6">
            与朋友一起学习，互相激励，共同成长
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-100">
              <div className="flex space-x-2">
                {[
                  { id: 'friends', label: '我的好友', icon: Users },
                  { id: 'discover', label: '发现用户', icon: UserPlus },
                  { id: 'leaderboard', label: '排行榜', icon: Trophy }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'friends' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="搜索好友或兴趣..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/80"
                  />
                </div>

                {/* Relationship Filter */}
                <select
                  value={relationshipFilter}
                  onChange={(e) => setRelationshipFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/80"
                >
                  {relationshipFilters.map(filter => (
                    <option key={filter} value={filter}>{filter}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/80"
                >
                  {statusFilters.map(filter => (
                    <option key={filter} value={filter}>{filter}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Friends Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFriends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Friend Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {friend.username[0]}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.status)}`}></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {friend.username}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRelationshipColor(friend.relationship)}`}>
                              {getRelationshipText(friend.relationship)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Level {friend.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="text-sm text-gray-600 flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatLastOnline(friend.lastOnline)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        friend.status === 'online' ? 'bg-green-100 text-green-700' :
                        friend.status === 'studying' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getStatusText(friend.status)}
                      </span>
                    </div>
                  </div>

                  {/* Study Stats */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Zap className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="font-bold text-orange-600">{friend.studyStreak}</span>
                        </div>
                        <div className="text-gray-500">连续天数</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <BookOpen className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="font-bold text-blue-600">{friend.todayStudied}</span>
                        </div>
                        <div className="text-gray-500">今日学习</div>
                      </div>
                    </div>
                    
                    {/* Weekly Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">本周进度</span>
                        <span className="text-sm text-gray-600">
                          {friend.weeklyProgress}/{friend.weeklyGoal}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((friend.weeklyProgress / friend.weeklyGoal) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center mb-2">
                      <Award className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">成就徽章</span>
                    </div>
                    <div className="flex space-x-2">
                      {friend.badges.slice(0, 3).map((badge, badgeIndex) => (
                        <div
                          key={badgeIndex}
                          className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                          title={badge}
                        >
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      ))}
                      {friend.badges.length > 3 && (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{friend.badges.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Common Interests */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center mb-2">
                      <Heart className="h-4 w-4 text-rose-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">共同兴趣</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {friend.commonInterests.map((interest, interestIndex) => (
                        <span
                          key={interestIndex}
                          className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg flex items-center justify-center"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        聊天
                      </motion.button>
                      <button className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <TrendingUp className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <UserCheck className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredFriends.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  没有找到匹配的好友
                </h3>
                <p className="text-gray-600 mb-6">
                  尝试调整搜索条件或去发现新朋友
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('discover')}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 mx-auto"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>发现新朋友</span>
                </motion.button>
              </div>
            )}
          </>
        )}

        {activeTab === 'discover' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              发现新朋友
            </h3>
            <p className="text-gray-600">
              功能开发中，敬请期待...
            </p>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              学习排行榜
            </h3>
            <p className="text-gray-600">
              功能开发中，敬请期待...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}