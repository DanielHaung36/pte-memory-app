'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Volume2
} from 'lucide-react'

interface AudioRecorderProps {
  onAudioReady?: (audioBlob: Blob, audioUrl: string) => void
  onUpload?: (file: File) => Promise<void>
  maxDuration?: number // 最大录音时长（秒）
  allowUpload?: boolean // 是否允许上传音频文件
  className?: string
}

export default function AudioRecorder({
  onAudioReady,
  onUpload,
  maxDuration = 120, // 默认2分钟
  allowUpload = true,
  className = ''
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      // 清理资源
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      stopMediaStream()
    }
  }, [audioUrl])

  const stopMediaStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)

        setAudioBlob(blob)
        setAudioUrl(url)

        if (onAudioReady) {
          onAudioReady(blob, url)
        }

        stopMediaStream()
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    } catch (err) {
      console.error('录音失败:', err)
      setError('无法访问麦克风，请检查权限设置')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // 恢复计时
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playAudio = () => {
    if (audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioBlob(null)
    setDuration(0)
    setIsPlaying(false)
  }

  const downloadRecording = () => {
    if (audioBlob && audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `recording-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      setError('请上传音频文件')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      if (onUpload) {
        await onUpload(file)
      }

      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setAudioBlob(file)

      if (onAudioReady) {
        onAudioReady(file, url)
      }
    } catch (err) {
      console.error('上传失败:', err)
      setError('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* 音频播放器（隐藏） */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 录音控制区 */}
      <div className="space-y-4">
        {/* 录音状态显示 */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 py-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
            <span className="text-lg font-semibold text-gray-900">
              {isPaused ? '已暂停' : '录音中...'}
            </span>
            <span className="text-2xl font-mono text-gray-900">
              {formatTime(duration)}
            </span>
            <span className="text-sm text-gray-500">
              / {formatTime(maxDuration)}
            </span>
          </motion.div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !audioUrl && (
            <>
              <motion.button
                type="button"
                onClick={startRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <Mic className="h-5 w-5" />
                开始录音
              </motion.button>

              {allowUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-5 w-5" />
                    {isUploading ? '上传中...' : '上传音频'}
                  </motion.button>
                </>
              )}
            </>
          )}

          {isRecording && (
            <>
              {!isPaused ? (
                <motion.button
                  type="button"
                  onClick={pauseRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="h-5 w-5" />
                  暂停
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={resumeRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  继续
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <Square className="h-5 w-5" />
                停止
              </motion.button>
            </>
          )}

          {audioUrl && !isRecording && (
            <>
              {!isPlaying ? (
                <motion.button
                  type="button"
                  onClick={playAudio}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  播放
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={pauseAudio}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="h-5 w-5" />
                  暂停
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={downloadRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
              </motion.button>

              <motion.button
                type="button"
                onClick={deleteRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </motion.button>
            </>
          )}
        </div>

        {/* 录音成功提示 */}
        {audioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-green-600"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">录音完成 ({formatTime(duration)})</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
