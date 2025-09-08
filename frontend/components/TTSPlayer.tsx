"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  Zap,
} from "lucide-react";

interface TTSPlayerProps {
  text: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface TTSSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
  language: string;
}

const TTSPlayer: React.FC<TTSPlayerProps> = ({
  text,
  autoPlay = false,
  showControls = true,
  className = "",
  onStart,
  onEnd,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [settings, setSettings] = useState<TTSSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: "",
    language: "zh-CN",
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const positionRef = useRef(0);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Set default voice (prefer Chinese voices)
      const chineseVoice = availableVoices.find(
        (voice) => voice.lang.includes("zh") || voice.name.includes("Chinese")
      );
      if (chineseVoice && !settings.voice) {
        setSettings((prev) => ({ ...prev, voice: chineseVoice.name }));
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      stop();
    };
  }, []);

  useEffect(() => {
    if (autoPlay && text) {
      play();
    }
  }, [text, autoPlay]);

  const createUtterance = () => {
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply settings
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;

    // Set voice
    const selectedVoice = voices.find((voice) => voice.name === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoading(false);
      onStart?.();

      // Estimate duration (approximate)
      const wordsPerMinute = 150 * settings.rate;
      const wordCount = text.split(" ").length;
      const estimatedDuration = (wordCount / wordsPerMinute) * 60;
      setDuration(estimatedDuration);

      startProgressTracking();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      positionRef.current = 0;
      stopProgressTracking();
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      stopProgressTracking();
      onError?.(event.error);
    };

    utterance.onboundary = (event) => {
      // Update position based on character index
      const progress = event.charIndex / text.length;
      const newPosition = progress * duration;
      setCurrentPosition(newPosition);
      positionRef.current = newPosition;
    };

    return utterance;
  };

  const startProgressTracking = () => {
    progressIntervalRef.current = setInterval(() => {
      if (isPlaying && !isPaused) {
        positionRef.current += 0.1;
        setCurrentPosition(positionRef.current);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  };

  const play = () => {
    if (!text.trim()) return;

    setIsLoading(true);

    if (isPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsLoading(false);
      startProgressTracking();
    } else {
      // Start new
      stop(); // Stop any existing speech
      utteranceRef.current = createUtterance();
      window.speechSynthesis.speak(utteranceRef.current);
    }
  };

  const pause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      stopProgressTracking();
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    setCurrentPosition(0);
    positionRef.current = 0;
    stopProgressTracking();
  };

  const togglePlayPause = () => {
    if (isLoading) return;

    if (isPlaying) {
      if (isPaused) {
        play();
      } else {
        pause();
      }
    } else {
      play();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return duration > 0 ? (currentPosition / duration) * 100 : 0;
  };

  if (!showControls) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlayPause}
        disabled={isLoading || !text.trim()}
        className={`inline-flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors ${className}`}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RotateCcw className="h-4 w-4" />
          </motion.div>
        ) : isPlaying && !isPaused ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isPlaying ? (isPaused ? "继续" : "暂停") : "朗读"}
        </span>
      </motion.button>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Volume2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">TTS 语音朗读</h3>
            <p className="text-sm text-gray-500">智能语音合成</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Text Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-700 line-clamp-3">{text}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentPosition)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stop}
          disabled={!isPlaying && !isPaused}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            positionRef.current = Math.max(0, positionRef.current - 10);
            setCurrentPosition(positionRef.current);
          }}
          disabled={!isPlaying}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipBack className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          disabled={isLoading || !text.trim()}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="h-6 w-6" />
            </motion.div>
          ) : isPlaying && !isPaused ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            positionRef.current = Math.min(duration, positionRef.current + 10);
            setCurrentPosition(positionRef.current);
          }}
          disabled={!isPlaying}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              volume: prev.volume > 0 ? 0 : 0.8,
            }))
          }
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {settings.volume > 0 ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="space-y-4">
            {/* Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语速: {settings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.rate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    rate: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音调: {settings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.pitch}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    pitch: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音量: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    volume: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语音
              </label>
              <select
                value={settings.voice}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, voice: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">默认语音</option>
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                setSettings({
                  rate: 1.0,
                  pitch: 1.0,
                  volume: 0.8,
                  voice: "",
                  language: "zh-CN",
                })
              }
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              重置设置
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TTSPlayer;
