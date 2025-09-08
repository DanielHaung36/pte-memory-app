"use client";

import { useState, useEffect } from "react";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useGame } from "@/contexts/GameContext";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import WordMatchGame from "@/components/WordMatchGame";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";

interface WordPair {
  id: string;
  english: string;
  chinese: string;
  difficulty: number;
  category: string;
}

export default function WordMatchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useReduxAuth();
  const { startGame, endGame, updateGameSession } = useGame();
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/auth/login");
      return;
    }
    loadWordPairs();
  }, [isAuthenticated]);

  const loadWordPairs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/games/words");
      const wordsData = response.data.words || [];
      
      // 转换为游戏需要的格式
      const formattedWords = wordsData.map((word: any) => ({
        word: word.english,
        definition: word.chinese,
      }));
      
      setWordPairs(formattedWords);
    } catch (error) {
      console.error("Failed to load word pairs:", error);
      // 如果API失败，使用后备数据
      const fallbackWords = [
        { word: "Analyze", definition: "分析" },
        { word: "Evaluate", definition: "评估" },
        { word: "Comprehensive", definition: "全面的" },
        { word: "Significant", definition: "重要的" },
        { word: "Hypothesis", definition: "假设" },
        { word: "Evidence", definition: "证据" },
        { word: "Conclude", definition: "得出结论" },
        { word: "Phenomenon", definition: "现象" },
      ];
      setWordPairs(fallbackWords);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    startGame("word_matching");
  };

  const handleGameComplete = async (score: number, timeSpent: number) => {
    // 更新游戏会话数据
    updateGameSession({
      score: score,
      questions_answered: wordPairs.length,
      correct_answers: Math.floor((score / 1000) * wordPairs.length), // 假设满分1000
    });

    // 结束游戏
    await endGame();
    
    // 返回游戏列表
    setTimeout(() => {
      router.push("/games");
    }, 2000);
  };

  const handleGoBack = () => {
    router.push("/games");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
            />
            <p className="text-lg font-medium text-gray-700 mb-2">
              正在加载单词数据...
            </p>
            <p className="text-sm text-gray-500">准备开始单词配对游戏</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoBack}
              className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </motion.button>
            
            <div>
              <motion.h1
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                🎯 单词配对游戏
              </motion.h1>
              <motion.p
                className="text-gray-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                将英文单词与对应的中文释义配对
              </motion.p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <Gamepad2 className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">
                {wordPairs.length} 个单词对
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                挑战高分
              </span>
            </div>
          </div>
        </div>

        {/* 游戏区域 */}
        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                准备开始单词配对？
              </h2>
              <p className="text-gray-600 mb-6">
                将英文单词与对应的中文释义正确配对，挑战你的词汇量！
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl text-purple-600 mb-2">📝</div>
                  <div className="font-semibold text-gray-900">学术词汇</div>
                  <div className="text-sm text-gray-600">PTE 常用词汇</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="text-2xl text-pink-600 mb-2">⏱️</div>
                  <div className="font-semibold text-gray-900">限时挑战</div>
                  <div className="text-sm text-gray-600">2分钟内完成</div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="text-2xl text-red-600 mb-2">🏆</div>
                  <div className="font-semibold text-gray-900">积分奖励</div>
                  <div className="text-sm text-gray-600">获得经验值</div>
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              🎮 开始游戏
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <WordMatchGame
              words={wordPairs}
              onGameComplete={handleGameComplete}
              timeLimit={120}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}