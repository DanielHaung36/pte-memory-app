"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Volume2,
  Sparkles,
  Tag,
  Brain,
  Target,
  BookOpen,
  Mic,
  PenTool,
  Eye,
  Headphones,
  Star,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import TTSPlayer from "@/components/TTSPlayer";
import { AnimatePresence } from "framer-motion";
import { useCreateQuestionMutation } from "@/lib/store/questionsApi";
import { useWebSocket } from "@/lib/websocket/client";

const QUESTION_TYPES = {
  speaking: {
    label: "口语",
    icon: <Mic className="h-5 w-5" />,
    color: "from-pink-400 to-rose-400",
    description: "口语表达、流利度和发音练习",
  },
  writing: {
    label: "写作",
    icon: <PenTool className="h-5 w-5" />,
    color: "from-purple-400 to-indigo-400",
    description: "写作结构、词汇和语法进步",
  },
  reading: {
    label: "阅读",
    icon: <Eye className="h-5 w-5" />,
    color: "from-blue-400 to-cyan-400",
    description: "阅读理解和信息提取能力",
  },
  listening: {
    label: "听力",
    icon: <Headphones className="h-5 w-5" />,
    color: "from-green-400 to-teal-400",
    description: "听力理解和注意力训练",
  },
};

const DIFFICULTY_LABELS = [
  {
    level: 1,
    label: "入门",
    color: "text-green-600",
    description: "基础水平，适合初学者",
  },
  {
    level: 2,
    label: "简单",
    color: "text-blue-600",
    description: "低级水平，需要一些经验",
  },
  {
    level: 3,
    label: "中等",
    color: "text-yellow-600",
    description: "中级水平，需要较多经验",
  },
  {
    level: 4,
    label: "困难",
    color: "text-orange-600",
    description: "高级水平，具有挑战性",
  },
  {
    level: 5,
    label: "专家",
    color: "text-red-600",
    description: "专家级别，极具挑战",
  },
];

export default function CreateQuestionPage() {
  const router = useRouter();
  const [createQuestion, { isLoading: isSubmitting }] = useCreateQuestionMutation();
  const { isConnected } = useWebSocket();

  const [formData, setFormData] = useState({
    type: "" as 'speaking' | 'writing' | 'reading' | 'listening' | "",
    title: "",
    content: "",
    correctAnswer: "",
    userAnswer: "",
    explanation: "",
    difficulty: 2 as 1 | 2 | 3 | 4 | 5,
    audioUrl: "",
    tags: [] as string[],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState("");
  const [showTTSPreview, setShowTTSPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 4;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.type) newErrors.type = "请选择题目类型";
      if (!formData.title.trim()) newErrors.title = "请输入题目标题";
      if (!formData.content.trim()) newErrors.content = "请输入题目内容";
    }

    if (step === 2) {
      if (!formData.correctAnswer.trim())
        newErrors.correctAnswer = "请输入正确答案";
      if (!formData.userAnswer.trim()) newErrors.userAnswer = "请输入你的答案";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    if (!formData.type) {
      toast.error("请选择题目类型");
      return;
    }

    try {
      const questionData = {
        title: formData.title,
        content: formData.content,
        question_type: formData.type,
        correct_answer: formData.correctAnswer,
        user_answer: formData.userAnswer,
        explanation: formData.explanation,
        difficulty_level: formData.difficulty,
        tags: formData.tags,
        audio_url: formData.audioUrl || undefined,
      };

      const result = await createQuestion(questionData).unwrap();

      toast.success("题目保存成功！系统已自动安排复习计划", {
        duration: 4000,
        icon: "🎉",
      });

      // 重置表单或跳转
      router.push('/questions');
      
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.message || "保存失败，请重试";
      toast.error(errorMessage);
      console.error("保存错题失败:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file upload
      console.log("File selected:", file);
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep)
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (step === currentStep)
      return (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {step}
        </div>
      );
    return (
      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
        {step}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="healing-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/questions">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </motion.button>
              </Link>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold healing-text-gradient">
                  添加新错题
                </h1>
                <p className="text-gray-600 mt-1">
                  精彩记录，智能复习，让学习更加高效
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
                (step, index) => (
                  <div key={step} className="flex items-center">
                    {getStepIcon(step)}
                    {index < totalSteps - 1 && (
                      <div
                        className={`w-8 h-1 mx-2 rounded-full ${
                          step < currentStep ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="healing-container py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-8"
                >
                  <div className="healing-card p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          基本信息
                        </h2>
                        <p className="text-gray-600">
                          设置题目类型、标题和内容
                        </p>
                      </div>
                    </div>

                    {/* Question Type Selection */}
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        题目类型 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(QUESTION_TYPES).map(([key, type]) => (
                          <motion.button
                            key={key}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, type: key }))
                            }
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              formData.type === key
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`p-3 bg-gradient-to-r ${type.color} rounded-xl mb-3 mx-auto w-fit`}
                            >
                              {type.icon}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {type.label}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {type.description}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                      {errors.type && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.type}
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        题目标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="给你的错题起个有意义的标题..."
                        className={`healing-input w-full ${
                          errors.title ? "border-red-500" : ""
                        }`}
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        题目内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={6}
                        value={formData.content}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        placeholder="详细描述题目内容，包括题目背景、要求等..."
                        className={`healing-input w-full ${
                          errors.content ? "border-red-500" : ""
                        }`}
                      />
                      {errors.content && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.content}
                        </p>
                      )}

                      {/* TTS Preview */}
                      {formData.content && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setShowTTSPreview(!showTTSPreview)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            <Volume2 className="h-4 w-4" />
                            <span>预览语音朗读</span>
                          </button>
                          {showTTSPreview && (
                            <div className="mt-3">
                              <TTSPlayer
                                text={formData.content}
                                showControls={false}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Answers */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-8"
                >
                  <div className="healing-card p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          答案对比
                        </h2>
                        <p className="text-gray-600">
                          记录正确答案和你的答案，便于对比学习
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Correct Answer */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🏆 正确答案 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={6}
                          value={formData.correctAnswer}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              correctAnswer: e.target.value,
                            }))
                          }
                          placeholder="输入正确的答案或参考答案..."
                          className={`healing-input w-full ${
                            errors.correctAnswer ? "border-red-500" : ""
                          }`}
                        />
                        {errors.correctAnswer && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.correctAnswer}
                          </p>
                        )}
                      </div>

                      {/* User Answer */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ❌ 我的答案 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={6}
                          value={formData.userAnswer}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              userAnswer: e.target.value,
                            }))
                          }
                          placeholder="输入你当时的答案或思路..."
                          className={`healing-input w-full ${
                            errors.userAnswer ? "border-red-500" : ""
                          }`}
                        />
                        {errors.userAnswer && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.userAnswer}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        💡 解析说明
                      </label>
                      <textarea
                        rows={4}
                        value={formData.explanation}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            explanation: e.target.value,
                          }))
                        }
                        placeholder="输入详细的解析、学习要点或备注..."
                        className="healing-input w-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Additional Settings */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-8"
                >
                  <div className="healing-card p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          附加设置
                        </h2>
                        <p className="text-gray-600">
                          设置难度等级、标签和多媒体内容
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Difficulty */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          雾度等级
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {DIFFICULTY_LABELS.map((item) => (
                            <motion.button
                              key={item.level}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  difficulty: item.level,
                                }))
                              }
                              className={`p-4 rounded-xl border-2 transition-all ${
                                formData.difficulty === item.level
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-center mb-2">
                                {[...Array(item.level)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 text-yellow-400 fill-current"
                                  />
                                ))}
                              </div>
                              <h3
                                className={`font-semibold mb-1 ${item.color}`}
                              >
                                {item.label}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {item.description}
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          标签
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addTag())
                            }
                            placeholder="输入标签，按 Enter 添加"
                            className="healing-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="healing-button-soft"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Audio URL */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          音频链接 (可选)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={formData.audioUrl}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                audioUrl: e.target.value,
                              }))
                            }
                            placeholder="https://example.com/audio.mp3"
                            className="healing-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="healing-button-soft flex items-center space-x-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>上传</span>
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-8"
                >
                  <div className="healing-card p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          确认保存
                        </h2>
                        <p className="text-gray-600">
                          最后检查一下信息，确认无误后保存
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        题目概览
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">类型</span>
                          <div className="flex items-center space-x-2">
                            {formData.type &&
                              QUESTION_TYPES[
                                formData.type as keyof typeof QUESTION_TYPES
                              ].icon}
                            <span className="font-medium">
                              {formData.type &&
                                QUESTION_TYPES[
                                  formData.type as keyof typeof QUESTION_TYPES
                                ].label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">标题</span>
                          <span className="font-medium text-right max-w-xs truncate">
                            {formData.title}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">难度</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(formData.difficulty)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-current"
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                              {
                                DIFFICULTY_LABELS[formData.difficulty - 1]
                                  ?.label
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">标签</span>
                          <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                            {formData.tags.length > 0 ? (
                              formData.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">无</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-600">音频</span>
                          <span className="text-sm">
                            {formData.audioUrl ? "已设置" : "无"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 text-center">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        className="healing-button-primary px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            保存错题
                          </>
                        )}
                      </motion.button>

                      <p className="text-sm text-gray-500 mt-4">
                        🎆 保存后系统将自动为你安排复习计划
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="healing-button-soft flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>上一步</span>
                  </motion.button>
                )}
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-500">
                  第 {currentStep} 步，共 {totalSteps} 步
                </span>
              </div>

              <div>
                {currentStep < totalSteps && (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="healing-button-primary flex items-center space-x-2"
                  >
                    <span>下一步</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </motion.button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
