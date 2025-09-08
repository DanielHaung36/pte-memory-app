"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { useRouter } from "next/navigation";
import { useCreateQuestionMutation } from "@/lib/store/questionsApi";
import {
  Clock,
  Star,
  Trophy,
  Zap,
  ArrowLeft,
  RotateCcw,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Target,
  CheckCircle,
  XCircle,
  Crown,
  Sparkles,
  Heart
} from "lucide-react";

interface WordPair {
  id: string;
  english: string;
  chinese: string;
  matched: boolean;
  category: string;
  difficulty: number;
}

const sampleWordPairs: WordPair[] = [
  { id: "1", english: "Achievement", chinese: "成就", matched: false, category: "education", difficulty: 2 },
  { id: "2", english: "Dedication", chinese: "奉献", matched: false, category: "character", difficulty: 3 },
  { id: "3", english: "Innovation", chinese: "创新", matched: false, category: "business", difficulty: 2 },
  { id: "4", english: "Excellence", chinese: "优秀", matched: false, category: "quality", difficulty: 2 },
  { id: "5", english: "Perseverance", chinese: "毅力", matched: false, category: "character", difficulty: 4 },
  { id: "6", english: "Collaboration", chinese: "合作", matched: false, category: "teamwork", difficulty: 3 },
  { id: "7", english: "Responsibility", chinese: "责任", matched: false, category: "character", difficulty: 3 },
  { id: "8", english: "Understanding", chinese: "理解", matched: false, category: "cognition", difficulty: 2 },
];

interface SelectedCard {
  id: string;
  type: 'english' | 'chinese';
  word: string;
  pairId: string;
}

export default function WordMatchingGame() {
  const router = useRouter();
  const [createQuestion] = useCreateQuestionMutation();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting');
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5分钟
  const [correctMatches, setCorrectMatches] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化游戏
  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 计时器
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, timeLeft]);

  const initializeGame = () => {
    // 随机选择8个单词对
    const shuffledPairs = [...sampleWordPairs].sort(() => Math.random() - 0.5);
    setWordPairs(shuffledPairs);
    setSelectedCards([]);
    setScore(0);
    setCorrectMatches(0);
    setWrongAttempts(0);
    setCombo(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(300);
    setGameState('waiting');
    setShowResults(false);
  };

  const startGame = () => {
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const playSound = (type: 'correct' | 'wrong' | 'complete') => {
    if (!soundEnabled) return;
    
    // 这里可以添加实际的音效
    const frequencies = {
      correct: 800,
      wrong: 300,
      complete: 1000
    };
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // 自动记录错题到用户题库
  const recordWrongAnswer = async (card1: SelectedCard, card2: SelectedCard) => {
    try {
      const wrongPair1 = wordPairs.find(p => p.id === card1.pairId);
      const wrongPair2 = wordPairs.find(p => p.id === card2.pairId);
      
      if (wrongPair1 && wrongPair2) {
        // 记录用户错误匹配的组合作为错题
        const questionTitle = `单词配对 - ${wrongPair1.english} vs ${wrongPair2.english}`;
        const questionContent = `你错误地将 "${card1.word}" 和 "${card2.word}" 配对了。\n\n正确答案:\n${wrongPair1.english} - ${wrongPair1.chinese}\n${wrongPair2.english} - ${wrongPair2.chinese}`;
        
        await createQuestion({
          title: questionTitle,
          content: questionContent,
          question_type: 'reading', // 词汇理解归类为阅读
          correct_answer: `${wrongPair1.english} - ${wrongPair1.chinese}; ${wrongPair2.english} - ${wrongPair2.chinese}`,
          user_answer: `${card1.word} - ${card2.word}`,
          explanation: `${wrongPair1.english} 的正确含义是 ${wrongPair1.chinese}，而 ${wrongPair2.english} 的正确含义是 ${wrongPair2.chinese}。记住这些词汇的准确含义。`,
          difficulty_level: Math.max(wrongPair1.difficulty, wrongPair2.difficulty) as 1 | 2 | 3 | 4 | 5,
          tags: ['游戏错题', '单词配对', wrongPair1.category, wrongPair2.category],
          source: '单词配对游戏'
        }).unwrap();
        
        console.log('错题已自动记录到题库');
      }
    } catch (error) {
      console.error('记录错题失败:', error);
    }
  };

  const handleCardClick = (id: string, type: 'english' | 'chinese', word: string, pairId: string) => {
    if (gameState !== 'playing') return;
    if (selectedCards.length >= 2) return;
    if (selectedCards.some(card => card.id === id)) return;
    if (wordPairs.find(pair => pair.id === pairId)?.matched) return;

    const newCard: SelectedCard = { id, type, word, pairId };
    const newSelectedCards = [...selectedCards, newCard];
    
    setSelectedCards(newSelectedCards);

    if (newSelectedCards.length === 2) {
      setTimeout(() => {
        checkMatch(newSelectedCards);
      }, 500);
    }
  };

  const checkMatch = (cards: SelectedCard[]) => {
    const [card1, card2] = cards;
    
    if (card1.pairId === card2.pairId && card1.type !== card2.type) {
      // 匹配成功
      setWordPairs(prev => prev.map(pair => 
        pair.id === card1.pairId ? { ...pair, matched: true } : pair
      ));
      
      const newCorrectMatches = correctMatches + 1;
      const newStreak = streak + 1;
      const newCombo = combo + 1;
      
      setCorrectMatches(newCorrectMatches);
      setStreak(newStreak);
      setCombo(newCombo);
      setMaxStreak(Math.max(maxStreak, newStreak));
      
      // 计算得分：基础分 + 连击奖励 + 时间奖励
      const baseScore = 100;
      const comboBonus = newCombo * 10;
      const timeBonus = Math.floor(timeLeft / 10);
      const totalPoints = baseScore + comboBonus + timeBonus;
      
      setScore(prev => prev + totalPoints);
      playSound('correct');
      
      // 检查是否完成所有匹配
      if (newCorrectMatches === wordPairs.length) {
        setGameState('finished');
        setShowResults(true);
        playSound('complete');
      }
    } else {
      // 匹配失败
      setWrongAttempts(prev => prev + 1);
      setStreak(0);
      setCombo(0);
      playSound('wrong');
      
      // 扣分
      setScore(prev => Math.max(0, prev - 10));
      
      // 自动记录错题
      recordWrongAnswer(card1, card2);
    }
    
    setSelectedCards([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    const totalAttempts = correctMatches + wrongAttempts;
    return totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0;
  };

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 创建卡片数组
  const allCards = wordPairs.flatMap(pair => [
    { id: `${pair.id}-en`, type: 'english' as const, word: pair.english, pairId: pair.id, matched: pair.matched },
    { id: `${pair.id}-cn`, type: 'chinese' as const, word: pair.chinese, pairId: pair.id, matched: pair.matched }
  ]);

  const shuffledCards = shuffleArray(allCards);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-4 h-4 bg-purple-300 rounded-full opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
          className="absolute top-20 right-20 w-6 h-6 bg-pink-300 rounded-full opacity-25"
        />
      </div>

      <AppNavigation />

      {/* 游戏头部信息 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  单词配对游戏
                </h1>
                <p className="text-gray-600">将英文单词与对应的中文释义配对</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition-colors ${
                  soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </motion.button>

              {gameState === 'playing' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseGame}
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-xl transition-colors"
                >
                  <Pause className="h-5 w-5" />
                </motion.button>
              )}

              {gameState === 'paused' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeGame}
                  className="p-2 bg-green-100 text-green-600 rounded-xl transition-colors"
                >
                  <Play className="h-5 w-5" />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="p-2 bg-blue-100 text-blue-600 rounded-xl transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* 游戏状态指示器 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white text-center">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{formatTime(timeLeft)}</div>
              <div className="text-xs opacity-75">剩余时间</div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{score.toLocaleString()}</div>
              <div className="text-xs opacity-75">分数</div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white text-center">
              <Target className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{correctMatches}/{wordPairs.length}</div>
              <div className="text-xs opacity-75">完成</div>
            </div>

            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 text-white text-center">
              <Zap className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{combo}</div>
              <div className="text-xs opacity-75">连击</div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl p-4 text-white text-center">
              <Star className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{getAccuracy()}%</div>
              <div className="text-xs opacity-75">准确率</div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white text-center">
              <Crown className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{maxStreak}</div>
              <div className="text-xs opacity-75">最高连击</div>
            </div>
          </div>
        </div>

        {/* 开始游戏界面 */}
        {gameState === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-8xl mb-6"
            >
              🎯
            </motion.div>
            
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              准备开始单词配对游戏
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              在5分钟内将英文单词与对应的中文释义配对。点击两张卡片进行匹配，连续配对成功可获得更高分数！
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="h-6 w-6 mr-2 inline" />
              开始游戏
            </motion.button>
          </motion.div>
        )}

        {/* 暂停界面 */}
        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <Pause className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">游戏已暂停</h2>
                <p className="text-gray-600 mb-6">点击继续按钮恢复游戏</p>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeGame}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium"
                  >
                    <Play className="h-5 w-5 mr-2 inline" />
                    继续游戏
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    退出游戏
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 游戏卡片区域 */}
        {(gameState === 'playing' || gameState === 'finished') && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {shuffledCards.map((card, index) => {
              const isSelected = selectedCards.some(selected => selected.id === card.id);
              const isMatched = card.matched;
              
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!isMatched && gameState === 'playing' ? { 
                    scale: 1.05, 
                    y: -5,
                    rotateY: 5
                  } : {}}
                  whileTap={!isMatched && gameState === 'playing' ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(card.id, card.type, card.word, card.pairId)}
                  className={`relative h-24 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isMatched 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg transform scale-95 opacity-80'
                      : isSelected 
                        ? `${card.type === 'english' 
                            ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
                            : 'bg-gradient-to-r from-pink-400 to-red-500'} text-white shadow-lg transform scale-105 rotate-3`
                        : `${card.type === 'english' 
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200' 
                            : 'bg-gradient-to-r from-pink-100 to-red-100 hover:from-pink-200 hover:to-red-200'} shadow-md hover:shadow-lg`
                  }`}
                >
                  <div className="flex items-center justify-center h-full p-4 text-center">
                    <span className={`font-medium ${
                      isMatched || isSelected ? 'text-white' : 
                      card.type === 'english' ? 'text-blue-700' : 'text-pink-700'
                    } ${card.type === 'english' ? 'text-sm' : 'text-base'}`}>
                      {card.word}
                    </span>
                  </div>
                  
                  {/* 匹配成功特效 */}
                  {isMatched && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <CheckCircle className="h-6 w-6 text-white" />
                    </motion.div>
                  )}

                  {/* 卡片类型指示器 */}
                  <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                    card.type === 'english' ? 'bg-blue-500' : 'bg-pink-500'
                  } ${isMatched || isSelected ? 'opacity-70' : 'opacity-30'}`} />

                  {/* 卡片闪光效果 */}
                  {isSelected && (
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-white rounded-2xl opacity-20 pointer-events-none"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 游戏结果弹窗 */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl mb-6"
                >
                  {correctMatches === wordPairs.length ? '🎉' : '⏰'}
                </motion.div>
                
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {correctMatches === wordPairs.length ? '恭喜完成！' : '时间到！'}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
                    <Trophy className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{score.toLocaleString()}</div>
                    <div className="text-sm opacity-75">总分</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <Target className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{correctMatches}/{wordPairs.length}</div>
                    <div className="text-sm opacity-75">正确配对</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <Star className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{getAccuracy()}%</div>
                    <div className="text-sm opacity-75">准确率</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 text-white">
                    <Zap className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{maxStreak}</div>
                    <div className="text-sm opacity-75">最高连击</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={initializeGame}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium"
                  >
                    再玩一次
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    返回游戏大厅
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}