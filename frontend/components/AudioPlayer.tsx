'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl?: string
  text?: string // For TTS
  autoPlay?: boolean
  className?: string
}

export default function AudioPlayer({ audioUrl, text, autoPlay = false, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // TTS functionality
  const speak = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      setIsLoading(true)
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = volume
      utterance.lang = 'en-US' // Default to English for PTE
      
      utterance.onstart = () => {
        setIsPlaying(true)
        setIsLoading(false)
      }
      
      utterance.onend = () => {
        setIsPlaying(false)
      }
      
      utterance.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        console.error('Speech synthesis error')
      }
      
      window.speechSynthesis.speak(utterance)
    } else {
      alert('您的浏览器不支持语音合成功能')
    }
  }

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }

  const togglePlayPause = () => {
    if (audioUrl && audioRef.current) {
      // Audio file playback
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else if (text) {
      // TTS playback
      if (isPlaying) {
        stopSpeech()
      } else {
        speak(text)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleProgressClick = (e: React.MouseEvent) => {
    if (audioRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width
      const newTime = (clickX / width) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    } else if ('speechSynthesis' in window) {
      // For TTS, we can't mute directly, so we adjust volume
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    } else if (text) {
      stopSpeech()
      speak(text)
    }
  }

  useEffect(() => {
    if (autoPlay && (audioUrl || text)) {
      togglePlayPause()
    }
  }, [autoPlay, audioUrl, text])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Audio element for file playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          volume={volume}
          muted={isMuted}
        />
      )}

      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        {/* Restart Button */}
        <button
          onClick={restartAudio}
          className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors duration-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress Bar (only for audio files) */}
        {audioUrl && (
          <div className="flex-1 mx-4">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
            >
              <div
                className="h-2 bg-primary-600 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Text for TTS */}
        {text && !audioUrl && (
          <div className="flex-1 mx-4">
            <p className="text-sm text-gray-700 line-clamp-2">{text}</p>
          </div>
        )}

        {/* Volume Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-gray-800"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Audio type indicator */}
      <div className="mt-2 text-xs text-gray-500">
        {audioUrl ? '🎵 音频文件' : '🔊 语音合成'}
      </div>
    </div>
  )
}