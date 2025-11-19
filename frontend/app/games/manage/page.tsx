"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2,
  Trophy,
  Star,
  Clock,
  Target,
  Zap,
  Play,
  Settings,
  BarChart3,
  TrendingUp,
  Award,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  X,
  Sparkles,
  Heart,
  Brain
} from "lucide-react";
import Link from "next/link";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { useGetGamesStatsQuery, useGetUserGamesHistoryQuery } from "@/lib/store/gamesApi";

const GAME_TYPES = {
  "word-match": { 
    name: "单词配对", 
    icon: <Target className="h-5 w-5" />, 
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    description: "快速匹配相关词汇",
    difficulty: "简单"
  },
  "memory-flip": { 
    name: "记忆翻牌", 
    icon: <Brain className="h-5 w-5" />, 
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "考验记忆力的翻牌游戏",
    difficulty: "中等"
  },
  "quick-select": { 
    name: "快速选择", 
    icon: <Zap className="h-5 w-5" />, 
    color: "bg-gradient-to-r from-orange-500 to-red-500",
    description: "在限时内快速选择正确答案",
    difficulty: "困难"
  },
  "word-matching": { 
    name: "词汇匹配", 
    icon: <Sparkles className="h-5 w-5" />, 
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    description: "拖拽匹配词汇与释义",
    difficulty: "简单"
  },
};

export default function GamesManagePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  
  const { data: statsData, isLoading: statsLoading } = useGetGamesStatsQuery();
  const { data: historyData, isLoading: historyLoading } = useGetUserGamesHistoryQuery({
    limit: 50,
    game_type: selectedGame === "all" ? undefined : selectedGame
  });

  if (statsLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">加载游戏数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = statsData?.stats;
  const gameHistory = historyData?.games || [];

  // Filter and sort game history
  const filteredGames = gameHistory
    .filter(game => {
      const matchesSearch = !searchTerm || 
        game.game_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        GAME_TYPES[game.game_type as keyof typeof GAME_TYPES]?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedGame === "all" || game.game_type === selectedGame;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'duration':
          return a.duration_seconds - b.duration_seconds;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-green-600 bg-green-100";
    if (percentage >= 70) return "text-blue-600 bg-blue-100";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  游戏管理
                </h1>
                <p className="text-gray-600 mt-1">寓教于乐，快乐学习</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/games">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始游戏
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Game Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">游戏总数</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_games}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Gamepad2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">最高得分</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.highest_score}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">平均得分</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.round(stats.average_score)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">游戏时长</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(stats.total_time_minutes)}m
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Available Games */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-pink-500" />
            可用游戏
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(GAME_TYPES).map(([gameType, config]) => (
              <motion.div
                key={gameType}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <Link href={`/games/${gameType}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 ${config.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <div className="text-white">
                        {config.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{config.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                    <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                      {config.difficulty}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索游戏记录..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-gray-50/50"
              />
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Game Type Filter */}
            <div className="flex items-center space-x-3">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">全部游戏</option>
                {Object.entries(GAME_TYPES).map(([gameType, config]) => (
                  <option key={gameType} value={gameType}>{config.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="date">按时间排序</option>
                <option value="score">按得分排序</option>
                <option value="duration">按时长排序</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Game History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              游戏记录
            </h2>
            <span className="text-sm text-gray-500">{filteredGames.length} 条记录</span>
          </div>

          {filteredGames.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "没有找到匹配的游戏记录" : "暂无游戏记录"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "尝试调整筛选条件" : "开始你的第一个游戏吧"}
              </p>
              <Link href="/games">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始游戏
                </motion.button>
              </Link>
            </div>
          ) : (
            filteredGames.map((game, index) => {
              const gameConfig = GAME_TYPES[game.game_type as keyof typeof GAME_TYPES];
              
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${gameConfig?.color || "bg-gray-500"} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <div className="text-white">
                          {gameConfig?.icon || <Gamepad2 className="h-5 w-5" />}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {gameConfig?.name || game.game_type}
                          </h3>
                          
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                            getScoreColor(game.score)
                          }`}>
                            <Trophy className="h-3 w-3 mr-1" />
                            {game.score} 分
                          </div>
                          
                          {game.is_completed && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已完成
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(game.duration_seconds)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(game.created_at)}</span>
                          </div>
                          
                          {game.accuracy && (
                            <div className="flex items-center space-x-1">
                              <Target className="h-4 w-4" />
                              <span>{Math.round(game.accuracy)}% 准确率</span>
                            </div>
                          )}
                        </div>
                        
                        {game.questions_attempted > 0 && (
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                            <span>题目：{game.questions_attempted}</span>
                            <span>正确：{game.correct_answers}</span>
                            <span>错误：{game.questions_attempted - game.correct_answers}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Actions dropdown */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setDropdownOpenId(dropdownOpenId === game.id ? null : game.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </motion.button>
                        
                        <AnimatePresence>
                          {dropdownOpenId === game.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                              onMouseLeave={() => setDropdownOpenId(null)}
                            >
                              <Link href={`/games/${game.game_type}`}>
                                <button
                                  onClick={() => setDropdownOpenId(null)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Play className="h-4 w-4 mr-3" />
                                  再玩一次
                                </button>
                              </Link>
                              
                              <button
                                onClick={() => {
                                  console.log('查看游戏详情:', game.id);
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                查看详情
                              </button>
                              
                              <button
                                onClick={() => {
                                  console.log('分享游戏记录:', game.id);
                                  setDropdownOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Users className="h-4 w-4 mr-3" />
                                分享成绩
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredGames.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-sm">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span className="text-gray-600">游戏记录：{filteredGames.length} 条</span>
              </div>
              {filteredGames.length !== gameHistory.length && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500">总计：{gameHistory.length} 条</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}