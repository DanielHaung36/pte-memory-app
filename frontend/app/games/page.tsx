"use client";

import { useEffect } from "react";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useGame } from "@/contexts/GameContext";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gamepad2,
  Trophy,
  Zap,
  Clock,
  Target,
  Star,
  Crown,
  TrendingUp,
  Play,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

const gameTypes = [
  {
    id: "word_matching",
    name: "单词配对",
    icon: "🎯",
    description: "将英文单词与中文释义配对",
    difficulty: "中等",
    gradient: "from-purple-500 to-pink-500",
    color: "purple",
    estimatedTime: "5-10分钟",
  },
  {
    id: "quick_select",
    name: "快速选择",
    icon: "⚡",
    description: "在限时内选择正确答案",
    difficulty: "困难",
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
    estimatedTime: "3-7分钟",
  },
  {
    id: "memory_flip",
    name: "记忆翻牌",
    icon: "🃏",
    description: "翻开卡片找到相同的配对",
    difficulty: "简单",
    gradient: "from-green-500 to-emerald-500",
    color: "green",
    estimatedTime: "8-12分钟",
  },
  {
    id: "listening_practice",
    name: "听力练习",
    icon: "🎧",
    description: "听音频选择正确答案",
    difficulty: "中等",
    gradient: "from-orange-500 to-red-500",
    color: "orange",
    estimatedTime: "10-15分钟",
  },
  {
    id: "spelling_challenge",
    name: "拼写挑战",
    icon: "✏️",
    description: "根据发音拼写单词",
    difficulty: "困难",
    gradient: "from-indigo-500 to-purple-500",
    color: "indigo",
    estimatedTime: "6-10分钟",
  },
];

const difficultyColors = {
  简单: "bg-green-100 text-green-800",
  中等: "bg-yellow-100 text-yellow-800",
  困难: "bg-red-100 text-red-800",
};

export default function GamesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useReduxAuth();
  const {
    gameStats,
    recentGames,
    achievements,
    loadGameStats,
    loadRecentGames,
    loadAchievements,
    startGame,
  } = useGame();

  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/auth/login");
      return;
    }

    loadGameStats();
    loadRecentGames();
    loadAchievements();
  }, [isAuthenticated, loadGameStats, loadRecentGames, loadAchievements]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleStartGame = (gameType: string) => {
    startGame(gameType);
    
    // Navigate to specific game page
    switch (gameType) {
      case 'word_matching':
        router.push('/games/word-match');
        break;
      case 'quick_select':
        router.push('/games/quick-select');
        break;
      case 'memory_flip':
        router.push('/games/memory-flip');
        break;
      case 'listening_practice':
        router.push('/games/listening-practice');
        break;
      case 'spelling_challenge':
        router.push('/games/spelling-challenge');
        break;
      default:
        console.log(`Game type ${gameType} not implemented yet`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <AppNavigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  互动小游戏
                </h1>
                <p className="text-gray-600 mt-2 flex items-center">
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  通过趣味游戏巩固记忆，寓教于乐
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {gameStats.level}
                  </div>
                  <div className="text-xs text-gray-500">当前等级</div>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Game Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">
                  {gameStats.total_score.toLocaleString()}
                </div>
                <div className="text-sm opacity-75">总积分</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">
                  {gameStats.total_games}
                </div>
                <div className="text-sm opacity-75">游戏次数</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">
                  {Math.round(gameStats.best_accuracy)}%
                </div>
                <div className="text-sm opacity-75">最高准确率</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-2">
                  {gameStats.fastest_time}s
                </div>
                <div className="text-sm opacity-75">最快完成</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Game Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameTypes.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${game.gradient} p-6 text-white relative`}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="text-4xl mb-4 inline-block"
                  >
                    {game.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                  <p className="text-white/80 text-sm">{game.description}</p>

                  {/* Decorative Elements */}
                  <div className="absolute top-2 right-2">
                    <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  </div>
                  <div className="absolute bottom-2 right-2 opacity-20">
                    <Play className="h-8 w-8" />
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={difficultyColors[game.difficulty]}>
                        {game.difficulty}
                      </Badge>
                      <span className="text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {game.estimatedTime}
                      </span>
                    </div>

                    {/* Personal Best Score */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">个人最佳</span>
                        <span className="font-semibold text-gray-800">
                          {Math.floor(Math.random() * 1000 + 500)}分
                        </span>
                      </div>
                      <Progress
                        value={Math.random() * 100}
                        className="mt-2 h-2"
                      />
                    </div>

                    <Button
                      onClick={() => handleStartGame(game.id)}
                      className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      开始游戏
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * gameTypes.length }}
            className="group"
          >
            <Card className="bg-white/50 backdrop-blur-sm border-dashed border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-6 text-white relative">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="text-4xl mb-4 inline-block"
                >
                  🚀
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">更多游戏</h3>
                <p className="text-white/80 text-sm">敬请期待更多有趣的游戏</p>

                <div className="absolute top-2 right-2">
                  <Star className="h-4 w-4 text-gray-300 fill-current" />
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <Badge className="bg-gray-100 text-gray-600">
                      即将推出
                    </Badge>
                    <span className="text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      待定
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">开发进度</span>
                      <span className="font-semibold text-gray-600">75%</span>
                    </div>
                    <Progress value={75} className="mt-2 h-2" />
                  </div>

                  <Button
                    disabled
                    className="w-full bg-gray-400 hover:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg cursor-not-allowed"
                  >
                    敬请期待
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Game Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                游戏攻略
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      如何获得高分
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></div>
                      准确率越高，分数越高
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                      完成速度越快，奖励越多
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      连续答对有额外加分
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                      完成游戏获得经验值
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                    <h3 className="font-semibold text-gray-900">积分用途</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
                      解锁新的游戏模式
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></div>
                      购买学习道具
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                      兑换学习奖励
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                      参与排行榜竞赛
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">成就系统</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></div>
                      连续游戏解锁称号
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                      高分记录获得徽章
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      特殊条件解锁奖励
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                      分享成果获得加成
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">小贴士</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2"></div>
                      先做简单难度游戏
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                      坚持每日游戏习惯
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                      错题可重复练习
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></div>
                      与朋友一起PK更有趣
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
