"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Crown,
  Star,
  MessageCircle,
  BookOpen,
  Calendar,
  Clock,
  Target,
  ChevronRight,
  TrendingUp,
  Award,
  UserPlus,
  Settings,
  MoreVertical,
  Heart,
  Share
} from 'lucide-react';
import AppNavigation from '@/components/ui/navigation/AppNavigation';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  tags: string[];
  weeklyGoal: number;
  completedGoal: number;
  createdAt: string;
  lastActivity: string;
  isJoined: boolean;
}

const mockGroups: StudyGroup[] = [
  {
    id: '1',
    name: 'PTE口语提升小组',
    description: '专注于PTE口语部分的练习与提高，包括Read Aloud, Repeat Sentence等题型的深入训练',
    memberCount: 12,
    maxMembers: 20,
    category: 'PTE',
    level: 'intermediate',
    isPrivate: false,
    owner: {
      id: 'user1',
      username: '李明'
    },
    tags: ['Speaking', 'PTE', '实战练习'],
    weeklyGoal: 50,
    completedGoal: 35,
    createdAt: '2025-01-05',
    lastActivity: '2025-01-10T09:30:00',
    isJoined: true
  },
  {
    id: '2',
    name: 'IELTS写作互助团',
    description: '雅思写作Task1和Task2的练习，互相批改，分享经验和模板',
    memberCount: 8,
    maxMembers: 15,
    category: 'IELTS',
    level: 'advanced',
    isPrivate: false,
    owner: {
      id: 'user2',
      username: 'Sarah'
    },
    tags: ['Writing', 'IELTS', '互助学习'],
    weeklyGoal: 30,
    completedGoal: 28,
    createdAt: '2025-01-03',
    lastActivity: '2025-01-10T14:22:00',
    isJoined: false
  },
  {
    id: '3',
    name: '零基础英语入门',
    description: '适合英语初学者的学习小组，从基础语法和词汇开始，循序渐进',
    memberCount: 25,
    maxMembers: 30,
    category: '基础英语',
    level: 'beginner',
    isPrivate: false,
    owner: {
      id: 'user3',
      username: '张老师'
    },
    tags: ['基础语法', '词汇', '新手'],
    weeklyGoal: 40,
    completedGoal: 40,
    createdAt: '2024-12-20',
    lastActivity: '2025-01-10T16:45:00',
    isJoined: false
  },
  {
    id: '4',
    name: '商务英语精英班',
    description: '商务英语专项训练，包括商务写作、演讲、谈判等实用技能',
    memberCount: 6,
    maxMembers: 10,
    category: '商务英语',
    level: 'advanced',
    isPrivate: true,
    owner: {
      id: 'user4',
      username: '王总'
    },
    tags: ['商务英语', '职场', '高级'],
    weeklyGoal: 25,
    completedGoal: 20,
    createdAt: '2025-01-01',
    lastActivity: '2025-01-09T11:15:00',
    isJoined: false
  }
];

const categories = ['全部', 'PTE', 'IELTS', '基础英语', '商务英语', '口语', '写作'];
const levels = ['全部', 'beginner', 'intermediate', 'advanced'];

export default function StudyGroupsPage() {
  const [groups] = useState<StudyGroup[]>(mockGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '全部' || group.category === selectedCategory;
    const matchesLevel = selectedLevel === '全部' || group.level === selectedLevel;
    
    if (activeTab === 'my-groups') {
      return matchesSearch && matchesCategory && matchesLevel && group.isJoined;
    }
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressPercentage = (completed: number, goal: number) => {
    return Math.min((completed / goal) * 100, 100);
  };

  const handleJoinGroup = (groupId: string) => {
    console.log('Join group:', groupId);
    // TODO: 实现加入群组逻辑
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              学习群组
            </h1>
          </motion.div>
          
          <p className="text-gray-600 mb-6">
            与志同道合的学习伙伴一起进步，共同实现学习目标
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-100">
              <div className="flex space-x-2">
                {[
                  { id: 'discover', label: '发现群组' },
                  { id: 'my-groups', label: '我的群组' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-2 rounded-xl font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜索群组名称、描述或标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === '全部' ? '全部等级' : getLevelText(level)}
                </option>
              ))}
            </select>

            {/* Create Group Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>创建群组</span>
            </motion.button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Group Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(group.level)}`}>
                        {getLevelText(group.level)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {group.category}
                      </span>
                      {group.isPrivate && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                  {group.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {group.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Group Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount}/{group.maxMembers} 成员</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(group.lastActivity).toLocaleDateString('zh-CN', { 
                        month: 'numeric', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">本周目标</span>
                  <span className="text-sm text-gray-600">
                    {group.completedGoal}/{group.weeklyGoal}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(group.completedGoal, group.weeklyGoal)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full"
                  />
                </div>
              </div>

              {/* Group Owner */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {group.owner.username[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {group.owner.username}
                      </div>
                      <div className="text-xs text-gray-500">群主</div>
                    </div>
                  </div>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </div>
              </div>

              {/* Actions */}
              <div className="p-6">
                {group.isJoined ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600 font-medium flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      已加入
                    </span>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Heart className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Share className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleJoinGroup(group.id)}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
                    >
                      加入群组
                    </motion.button>
                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Heart className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Share className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              没有找到匹配的群组
            </h3>
            <p className="text-gray-600 mb-6">
              尝试调整搜索条件或创建一个新的学习群组
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>创建群组</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Create Group Modal - 简化版，后续可扩展 */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                创建学习群组
              </h3>
              <p className="text-gray-600 mb-6">
                功能开发中，敬请期待...
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}