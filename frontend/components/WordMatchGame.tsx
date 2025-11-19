'use client'

import { useState, useEffect } from 'react'
import { Shuffle, RotateCcw, Trophy, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WordPair {
  id: string
  word: string
  definition: string
  matched: boolean
}

interface GameCard extends WordPair {
  pairId: string
  type: 'word' | 'definition'
  content: string
}

interface WordMatchGameProps {
  words: { word: string; definition: string }[]
  onGameComplete?: (score: number, timeSpent: number) => void
  timeLimit?: number // in seconds
}

export default function WordMatchGame({ 
  words, 
  onGameComplete, 
  timeLimit = 120 
}: WordMatchGameProps) {
  const [gameWords, setGameWords] = useState<WordPair[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed'>('ready')
  const [shuffledCards, setShuffledCards] = useState<GameCard[]>([])

  useEffect(() => {
    // Only initialize game when words change AND it's a new game (not currently playing)
    if (words.length > 0 && gameState === 'ready' && gameWords.length === 0) {
      initializeGame()
    }
  }, [words, gameState, gameWords.length])

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame()
    }
  }, [timeLeft, gameState])

  useEffect(() => {
    if (matchedPairs.length === gameWords.length && gameWords.length > 0) {
      endGame()
    }
  }, [matchedPairs, gameWords])

  const initializeGame = () => {
    const wordPairs: WordPair[] = words.map((item, index) => ({
      id: `pair-${index}`,
      word: item.word,
      definition: item.definition,
      matched: false
    }))

    setGameWords(wordPairs)

    // Create cards for both words and definitions with unique IDs but same pairId
    const cards = wordPairs.flatMap(pair => [
      { 
        ...pair, 
        id: `${pair.id}-word`,
        pairId: pair.id,
        type: 'word' as const, 
        content: pair.word 
      },
      { 
        ...pair, 
        id: `${pair.id}-definition`,
        pairId: pair.id,
        type: 'definition' as const, 
        content: pair.definition 
      }
    ])

    // Shuffle cards
    const shuffled = cards.sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    
    setSelectedCards([])
    setMatchedPairs([])
    setScore(0)
    setTimeLeft(timeLimit)
    setGameState('ready')
  }

  const startGame = () => {
    setGameState('playing')
  }

  const endGame = () => {
    setGameState('completed')
    const finalScore = calculateScore()
    const timeSpent = timeLimit - timeLeft
    onGameComplete?.(finalScore, timeSpent)
  }

  const calculateScore = () => {
    const baseScore = matchedPairs.length * 100
    const timeBonus = Math.max(0, timeLeft * 2)
    const accuracyBonus = matchedPairs.length === gameWords.length ? 500 : 0
    return baseScore + timeBonus + accuracyBonus
  }

  const handleCardClick = (cardId: string, cardType: 'word' | 'definition') => {
    if (gameState !== 'playing' || selectedCards.length >= 2) return
    if (selectedCards.includes(cardId) || matchedPairs.includes(cardId)) return

    const newSelectedCards = [...selectedCards, cardId]
    setSelectedCards(newSelectedCards)

    if (newSelectedCards.length === 2) {
      const [firstCardId, secondCardId] = newSelectedCards
      const firstCard = shuffledCards.find(card => card.id === firstCardId)
      const secondCard = shuffledCards.find(card => card.id === secondCardId)

      if (firstCard && secondCard) {
        // Check if it's a valid match (same pairId but different types)
        if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
          // Match found!
          setTimeout(() => {
            setMatchedPairs(prev => [...prev, firstCard.pairId])
            setSelectedCards([])
            setScore(prev => prev + 100)
          }, 500)
        } else {
          // No match
          setTimeout(() => {
            setSelectedCards([])
          }, 600)
        }
      }
    }
  }

  const getCardStyle = (cardId: string, pairId: string) => {
    if (matchedPairs.includes(pairId)) {
      return 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 text-green-800 ring-2 ring-green-300'
    }
    if (selectedCards.includes(cardId)) {
      return 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-400 text-blue-800 ring-2 ring-blue-300 transform scale-105'
    }
    return 'bg-gradient-to-br from-white to-gray-50 border-gray-300 text-gray-800 hover:border-gray-400 hover:from-gray-50 hover:to-gray-100'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resetGame = () => {
    initializeGame()
  }

  const shuffleCards = () => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }

  if (gameState === 'ready') {
    return (
      <div className="card text-center">
        <Trophy className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">单词配对游戏</h2>
        <p className="text-gray-600 mb-6">
          将英文单词与其对应的中文释义配对。在 {timeLimit} 秒内完成所有配对！
        </p>
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">题目数量: </span>
            <span className="font-semibold">{words.length} 对</span>
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">时间限制: </span>
            <span className="font-semibold">{timeLimit} 秒</span>
          </div>
        </div>
        <button
          onClick={startGame}
          className="btn-primary text-lg px-8 py-3"
        >
          开始游戏
        </button>
      </div>
    )
  }

  if (gameState === 'completed') {
    const finalScore = calculateScore()
    return (
      <div className="card text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">游戏结束！</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{matchedPairs.length}</div>
            <div className="text-sm text-gray-600">配对成功</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{finalScore}</div>
            <div className="text-sm text-gray-600">最终得分</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={resetGame}
            className="btn-secondary flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            再玩一次
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
              <Clock className={`w-5 h-5 ${timeLeft <= 30 ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`font-mono text-lg font-bold ${timeLeft <= 30 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">得分: </span>
              <span className="text-lg font-bold text-primary-600">{score}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{matchedPairs.length}</span>
              </div>
              <span className="text-sm text-gray-600">进度: </span>
              <span className="text-lg font-bold text-green-600">
                {matchedPairs.length}/{gameWords.length}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shuffleCards}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-colors"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              洗牌
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </motion.button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        <AnimatePresence>
          {shuffledCards.map((card, index) => (
            <motion.div
              key={`${card.id}-${card.type}`}
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ 
                delay: index * 0.03,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ 
                scale: matchedPairs.includes(card.pairId) ? 1 : 1.05,
                y: matchedPairs.includes(card.pairId) ? 0 : -2
              }}
              whileTap={{ scale: 0.95 }}
              className="perspective-1000"
            >
              <button
                onClick={() => handleCardClick(card.id, card.type)}
                disabled={matchedPairs.includes(card.pairId) || (selectedCards.length >= 2 && !selectedCards.includes(card.id))}
                className={`w-full h-28 md:h-32 p-3 rounded-xl border-2 transition-all duration-300 transform-gpu ${getCardStyle(card.id, card.pairId)} ${
                  matchedPairs.includes(card.pairId) || (selectedCards.length >= 2 && !selectedCards.includes(card.id)) 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer shadow-md hover:shadow-lg'
                } ${matchedPairs.includes(card.pairId) ? 'animate-pulse' : ''}`}
              >
                <div className="flex flex-col h-full justify-center items-center">
                  <div className="text-sm md:text-base font-semibold text-center leading-tight mb-1">
                    {card.type === 'word' ? card.word : card.definition}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    card.type === 'word' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {card.type === 'word' ? '🇬🇧 ENG' : '🇨🇳 中文'}
                  </div>
                </div>
                {matchedPairs.includes(card.pairId) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-2xl">✅</div>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <span className="font-medium flex items-center">
            🎯 游戏进度
          </span>
          <span className="font-bold text-lg text-primary-600">
            {((matchedPairs.length / gameWords.length) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(matchedPairs.length / gameWords.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full relative"
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>已完成: {matchedPairs.length} 对</span>
          <span>剩余: {gameWords.length - matchedPairs.length} 对</span>
        </div>
      </div>
    </div>
  )
}