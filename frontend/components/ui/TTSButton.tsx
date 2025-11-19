"use client";

import { useState } from "react";
import { Button } from "./button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface TTSButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "ghost" | "outline";
}

export default function TTSButton({ 
  text, 
  className, 
  size = "sm", 
  variant = "ghost" 
}: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const speak = async () => {
    try {
      setIsLoading(true);
      
      // 如果当前正在播放，停止播放
      if (isPlaying) {
        speechSynthesis.cancel();
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      // 检查浏览器支持
      if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        setIsLoading(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 配置语音参数
      utterance.rate = 0.8; // 语速
      utterance.pitch = 1; // 音调
      utterance.volume = 1; // 音量
      
      // 尝试使用英文语音
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en') || voice.lang.includes('US') || voice.lang.includes('GB')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      // 事件监听器
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      // 播放语音
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={speak}
        size={size}
        variant={variant}
        className={`relative ${className}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Volume2 className="h-4 w-4 text-green-600" />
          </motion.div>
        ) : (
          <VolumeX className="h-4 w-4 text-gray-600 hover:text-blue-600" />
        )}
        
        {/* 播放时的声波效果 */}
        {isPlaying && (
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
            }}
          />
        )}
      </Button>
    </motion.div>
  );
}