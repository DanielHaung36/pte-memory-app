"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { useRouter } from "next/navigation";
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
  Heart,
  TimerIcon
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: number;
  explanation?: string;
}

const sampleQuestions: Question[] = [
  {
    id: "1",
    question: "What does 'Achievement' mean in Chinese?",
    options: ["成就", "失败", "尝试", "困难"],
    correctAnswer: 0,
    category: "vocabulary",
    difficulty: 2,
    explanation: "Achievement means completing something successfully or gaining a desired outcome."
  },
  {
    id: "2", 
    question: "Which word means '创新' in English?",
    options: ["Tradition", "Innovation", "Convention", "Imitation"],
    correctAnswer: 1,
    category: "vocabulary",
    difficulty: 2,
    explanation: "Innovation means introducing new ideas, methods or products."
  },
  {
    id: "3",
    question: "What is the past tense of 'run'?",
    options: ["runned", "ran", "running", "runs"],
    correctAnswer: 1,
    category: "grammar",
    difficulty: 1,
    explanation: "The past tense of 'run' is 'ran' (irregular verb)."
  },
  {
    id: "4",
    question: "Which sentence is grammatically correct?",
    options: [
      "I have went to the store",
      "I have gone to the store", 
      "I have go to the store",
      "I have going to the store"
    ],
    correctAnswer: 1,
    category: "grammar",
    difficulty: 3,
    explanation: "The correct form uses 'have gone' (present perfect with past participle)."
  },
  {
    id: "5",
    question: "What does 'Perseverance' mean?",
    options: ["放弃", "毅力", "懒惰", "恐惧"],
    correctAnswer: 1,
    category: "vocabulary",
    difficulty: 4,
    explanation: "Perseverance means continuing in a course of action despite difficulty."
  }
];

export default function QuickSelectGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2分钟总时间
  const [questionTimeLeft, setQuestionTimeLeft] = useState(15); // 每题15秒
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏
  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, []);

  // 主计时器
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
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

  // 单题计时器
  useEffect(() => {
    if (gameState === 'playing' && questionTimeLeft > 0 && selectedAnswer === null) {
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleAnswer(null); // 超时自动提交
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    }

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [gameState, questionTimeLeft, selectedAnswer]);

  const initializeGame = () => {
    const shuffledQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(120);
    setQuestionTimeLeft(15);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setStreak(0);
    setMaxStreak(0);
    setGameState('waiting');
    setShowResults(false);
    setShowExplanation(false);
    setAnsweredCorrectly(null);
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

  const endGame = () => {
    setGameState('finished');
    setShowResults(true);
  };

  const playSound = (type: 'correct' | 'wrong' | 'complete' | 'tick') => {
    if (!soundEnabled) return;
    
    const frequencies = {
      correct: 800,
      wrong: 300,
      complete: 1000,
      tick: 600
    };
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (type === 'tick' ? 0.1 : 0.5));
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + (type === 'tick' ? 0.1 : 0.5));
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    
    const currentQ = questions[currentQuestion];
    const isCorrect = answerIndex === currentQ.correctAnswer;
    
    setAnsweredCorrectly(isCorrect);
    setShowExplanation(true);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      setCorrectAnswers(prev => prev + 1);
      
      // 计算得分：基础分 + 时间奖励 + 连击奖励
      const baseScore = 100;
      const timeBonus = questionTimeLeft * 5;
      const streakBonus = newStreak * 10;
      const totalPoints = baseScore + timeBonus + streakBonus;
      
      setScore(prev => prev + totalPoints);
      playSound('correct');
    } else {
      setStreak(0);
      setWrongAnswers(prev => prev + 1);
      playSound('wrong');
    }

    // 2秒后进入下一题或结束游戏
    setTimeout(() => {
      if (currentQuestion + 1 >= questions.length) {
        endGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentQuestion(prev => prev + 1);
    setSelectedAnswer(null);
    setQuestionTimeLeft(15);
    setShowExplanation(false);
    setAnsweredCorrectly(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    const totalAnswered = correctAnswers + wrongAnswers;
    return totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-4 h-4 bg-cyan-300 rounded-full opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
          className="absolute top-20 right-20 w-6 h-6 bg-blue-300 rounded-full opacity-25"
        />
      </div>

      <AppNavigation />

      {/* 游戏头部信息 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  快速选择游戏
                </h1>
                <p className="text-gray-600">在限时内选择正确答案，越快越高分！</p>
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

          {/* 游戏统计 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white text-center">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{formatTime(timeLeft)}</div>
              <div className="text-xs opacity-75">总时间</div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{score.toLocaleString()}</div>
              <div className="text-xs opacity-75">分数</div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white text-center">
              <Target className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{currentQuestion + 1}/{questions.length}</div>
              <div className="text-xs opacity-75">进度</div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white text-center">
              <Zap className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{streak}</div>
              <div className="text-xs opacity-75">连击</div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white text-center">
              <Star className="h-6 w-6 mx-auto mb-2" />
              <div className="text-lg font-bold">{getAccuracy()}%</div>
              <div className="text-xs opacity-75">准确率</div>
            </div>
          </div>

          {/* 进度条 */}
          {gameState !== 'waiting' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>游戏进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
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
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-8xl mb-6"
            >
              ⚡
            </motion.div>
            
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              准备快速选择挑战
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              2分钟内回答{questions.length}道题，每题15秒限时。答对得分，连击有奖励，速度越快分数越高！
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="h-6 w-6 mr-2 inline" />
              开始挑战
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

        {/* 游戏界面 */}
        {gameState === 'playing' && currentQ && (
          <div className="space-y-6">
            {/* 题目卡片 */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {currentQuestion + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      第 {currentQuestion + 1} 题
                    </h3>
                    <p className="text-gray-600">分类: {currentQ.category}</p>
                  </div>
                </div>

                <div className="text-center">
                  <motion.div
                    key={questionTimeLeft}
                    initial={{ scale: 1.2, color: "#ef4444" }}
                    animate={{ scale: 1, color: questionTimeLeft <= 5 ? "#ef4444" : "#6b7280" }}
                    className={`text-3xl font-bold ${questionTimeLeft <= 5 ? 'text-red-500' : 'text-gray-600'}`}
                  >
                    {questionTimeLeft}
                  </motion.div>
                  <div className="text-sm text-gray-500">秒</div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                  {currentQ.question}
                </h2>
              </div>

              {/* 选项 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((option, index) => {
                  let buttonClass = "p-4 rounded-xl font-medium transition-all duration-300 border-2 ";
                  
                  if (showExplanation) {
                    if (index === currentQ.correctAnswer) {
                      buttonClass += "bg-green-100 text-green-700 border-green-300";
                    } else if (index === selectedAnswer && selectedAnswer !== currentQ.correctAnswer) {
                      buttonClass += "bg-red-100 text-red-700 border-red-300";
                    } else {
                      buttonClass += "bg-gray-100 text-gray-500 border-gray-200";
                    }
                  } else {
                    buttonClass += "bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:scale-105 cursor-pointer";
                  }

                  return (
                    <motion.button
                      key={index}
                      whileHover={!showExplanation ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!showExplanation ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={buttonClass}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-left flex-1">{option}</span>
                        
                        {showExplanation && index === currentQ.correctAnswer && (
                          <CheckCircle className="h-6 w-6 text-green-600 ml-2" />
                        )}
                        {showExplanation && index === selectedAnswer && selectedAnswer !== currentQ.correctAnswer && (
                          <XCircle className="h-6 w-6 text-red-600 ml-2" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* 解释 */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${answeredCorrectly ? 'bg-green-100' : 'bg-red-100'}`}>
                        {answeredCorrectly ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${answeredCorrectly ? 'text-green-700' : 'text-red-700'}`}>
                          {answeredCorrectly ? '回答正确！' : '回答错误'}
                        </h4>
                        {currentQ.explanation && (
                          <p className="text-gray-600 mt-2">{currentQ.explanation}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
                  {getAccuracy() >= 80 ? '🏆' : getAccuracy() >= 60 ? '👏' : '💪'}
                </motion.div>
                
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  游戏结束！
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                    <Trophy className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{score.toLocaleString()}</div>
                    <div className="text-sm opacity-75">总分</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <Target className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{correctAnswers}/{questions.length}</div>
                    <div className="text-sm opacity-75">正确率</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <Star className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{getAccuracy()}%</div>
                    <div className="text-sm opacity-75">准确率</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
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
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium"
                  >
                    再挑战一次
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