"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Clock,
  Star,
  CheckCircle2,
  Zap,
  Brain,
} from "lucide-react";

interface MemoryCard {
  id: number;
  word: string;
  translation: string;
  isFlipped: boolean;
  isMatched: boolean;
  type: 'word' | 'translation';
}

const WORD_PAIRS = [
  { word: "amazing", translation: "令人惊奇的" },
  { word: "beautiful", translation: "美丽的" },
  { word: "challenge", translation: "挑战" },
  { word: "discover", translation: "发现" },
  { word: "exciting", translation: "令人兴奋的" },
  { word: "fantastic", translation: "极好的" },
  { word: "genuine", translation: "真诚的" },
  { word: "incredible", translation: "难以置信的" },
];

export default function MemoryFlipGame() {
  const router = useRouter();
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameStarted && !isGameCompleted) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameStarted, isGameCompleted]);

  // Check for game completion
  useEffect(() => {
    if (matches === WORD_PAIRS.length && isGameStarted) {
      setIsGameCompleted(true);
      calculateFinalScore();
    }
  }, [matches, isGameStarted]);

  const initializeGame = () => {
    const gameCards: MemoryCard[] = [];
    
    // Create cards for each word pair
    WORD_PAIRS.forEach((pair, index) => {
      gameCards.push({
        id: index * 2,
        word: pair.word,
        translation: pair.translation,
        isFlipped: false,
        isMatched: false,
        type: 'word'
      });
      gameCards.push({
        id: index * 2 + 1,
        word: pair.word,
        translation: pair.translation,
        isFlipped: false,
        isMatched: false,
        type: 'translation'
      });
    });

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setTimer(0);
    setIsGameStarted(false);
    setIsGameCompleted(false);
    setScore(0);
  };

  const handleCardClick = (cardId: number) => {
    if (!isGameStarted) {
      setIsGameStarted(true);
    }

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Update card state
    setCards(prevCards => 
      prevCards.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard && secondCard && 
            firstCard.word === secondCard.word && 
            firstCard.type !== secondCard.type) {
          // Match found
          setCards(prevCards => 
            prevCards.map(c => 
              c.id === firstId || c.id === secondId 
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches(prev => prev + 1);
        } else {
          // No match - flip cards back
          setCards(prevCards => 
            prevCards.map(c => 
              c.id === firstId || c.id === secondId 
                ? { ...c, isFlipped: false }
                : c
            )
          );
        }
        
        setFlippedCards([]);
      }, 1000);
    }
  };

  const calculateFinalScore = () => {
    // Score calculation: base score - time penalty - moves penalty + match bonus
    const baseScore = 1000;
    const timePenalty = Math.min(timer * 2, 400);
    const movesPenalty = Math.max(moves - WORD_PAIRS.length, 0) * 10;
    const matchBonus = matches * 50;
    
    const finalScore = Math.max(baseScore - timePenalty - movesPenalty + matchBonus, 100);
    setScore(finalScore);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardContent = (card: MemoryCard) => {
    return card.type === 'word' ? card.word : card.translation;
  };

  const getCardBackground = (card: MemoryCard) => {
    if (card.isMatched) {
      return "bg-gradient-to-br from-green-400 to-green-600";
    }
    if (card.isFlipped) {
      return card.type === 'word' 
        ? "bg-gradient-to-br from-blue-400 to-blue-600"
        : "bg-gradient-to-br from-purple-400 to-purple-600";
    }
    return "bg-gradient-to-br from-gray-400 to-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    🃏 记忆翻牌
                  </h1>
                  <p className="text-gray-600">翻开卡片找到相同的配对</p>
                </div>
              </div>
              
              <Button
                onClick={initializeGame}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重新开始
              </Button>
            </div>
            
            {/* Game Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-lg font-semibold text-blue-800">{formatTime(timer)}</div>
                <div className="text-xs text-blue-600">时间</div>
              </div>
              
              <div className="bg-purple-100 rounded-lg p-3 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-lg font-semibold text-purple-800">{moves}</div>
                <div className="text-xs text-purple-600">步数</div>
              </div>
              
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-lg font-semibold text-green-800">{matches}/{WORD_PAIRS.length}</div>
                <div className="text-xs text-green-600">配对</div>
              </div>
              
              <div className="bg-yellow-100 rounded-lg p-3 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <div className="text-lg font-semibold text-yellow-800">{score}</div>
                <div className="text-xs text-yellow-600">得分</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
              >
                <Card
                  className={`h-32 cursor-pointer transition-all duration-300 transform preserve-3d ${
                    card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                  }`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className="relative w-full h-full">
                    {/* Card Back */}
                    <div className={`absolute inset-0 rounded-lg flex items-center justify-center backface-hidden ${
                      card.isFlipped || card.isMatched ? "opacity-0" : "opacity-100"
                    }`}>
                      <div className="bg-gradient-to-br from-gray-400 to-gray-600 w-full h-full rounded-lg flex items-center justify-center">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Card Front */}
                    <div className={`absolute inset-0 rounded-lg flex items-center justify-center backface-hidden rotate-y-180 ${
                      card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"
                    }`}>
                      <div className={`w-full h-full rounded-lg flex items-center justify-center text-white ${getCardBackground(card)}`}>
                        <div className="text-center p-2">
                          <div className={`font-semibold ${
                            card.type === 'word' ? 'text-lg' : 'text-sm'
                          }`}>
                            {getCardContent(card)}
                          </div>
                          {card.isMatched && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <CheckCircle2 className="h-6 w-6 mx-auto mt-2 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Game Completion Modal */}
        <AnimatePresence>
          {isGameCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    恭喜完成！
                  </h2>
                  <p className="text-gray-600 mb-6">
                    你成功找到了所有配对！
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatTime(timer)}</div>
                      <div className="text-xs text-gray-500">时间</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{moves}</div>
                      <div className="text-xs text-gray-500">步数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{score}</div>
                      <div className="text-xs text-gray-500">得分</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={initializeGame}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white"
                    >
                      再玩一次
                    </Button>
                    <Button
                      onClick={() => router.push('/games')}
                      variant="outline"
                      className="flex-1"
                    >
                      返回游戏
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">游戏规则</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🎯 游戏目标</h4>
              <ul className="space-y-1">
                <li>• 翻开卡片找到英文单词与中文释义的配对</li>
                <li>• 尽可能用最少的步数完成所有配对</li>
                <li>• 挑战你的记忆力和专注力</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🏆 得分规则</h4>
              <ul className="space-y-1">
                <li>• 基础分数：1000分</li>
                <li>• 时间奖励：用时越短得分越高</li>
                <li>• 步数奖励：步数越少得分越高</li>
                <li>• 配对奖励：每个配对+50分</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}