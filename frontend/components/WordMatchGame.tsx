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
  const [shuffledCards, setShuffledCards] = useState<(WordPair & { type: 'word' | 'definition' })[]>([])

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

    // Create cards for both words and definitions
    const cards = wordPairs.flatMap(pair => [
      { ...pair, type: 'word' as const, content: pair.word },
      { ...pair, type: 'definition' as const, content: pair.definition }
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
        // Check if it's a valid match (same pair ID but different types)
        if (firstCard.id === secondCard.id && firstCard.type !== secondCard.type) {
          // Match found!
          setTimeout(() => {
            setMatchedPairs(prev => [...prev, firstCard.id])
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

  const getCardStyle = (cardId: string) => {
    if (matchedPairs.includes(cardId)) {
      return 'bg-green-100 border-green-300 text-green-800'
    }
    if (selectedCards.includes(cardId)) {
      return 'bg-blue-100 border-blue-300 text-blue-800'
    }
    return 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
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
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className={`font-mono text-lg ${timeLeft <= 30 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">得分: </span>
              <span className="text-lg font-bold text-primary-600">{score}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">进度: </span>
              <span className="text-lg font-bold text-green-600">
                {matchedPairs.length}/{gameWords.length}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={shuffleCards}
              className="btn-secondary flex items-center"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              洗牌
            </button>
            <button
              onClick={resetGame}
              className="btn-secondary flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnimatePresence>
          {shuffledCards.map((card, index) => (
            <motion.div
              key={`${card.id}-${card.type}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => handleCardClick(card.id, card.type)}
                disabled={matchedPairs.includes(card.id) || selectedCards.length >= 2}
                className={`w-full h-24 p-3 rounded-lg border-2 transition-all duration-200 ${getCardStyle(card.id)} ${
                  matchedPairs.includes(card.id) || selectedCards.length >= 2 ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="text-sm font-medium text-center">
                  {card.type === 'word' ? card.word : card.definition}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {card.type === 'word' ? '英文' : '中文'}
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>游戏进度</span>
          <span>{((matchedPairs.length / gameWords.length) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(matchedPairs.length / gameWords.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
          ></motion.div>
        </div>
      </div>
    </div>
  )
}