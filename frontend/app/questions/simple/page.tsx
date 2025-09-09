"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Mic,
  PenTool,
  Eye,
  Headphones,
  Star,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useCreateQuestionMutation } from "@/lib/store/questionsApi";
import { useWebSocket } from "@/lib/websocket/client";
import { AIServices } from "@/lib/ai-services";
import AppNavigation from "@/components/ui/navigation/AppNavigation";

const QUESTION_TYPES = {
  speaking: {
    label: "口语",
    icon: <Mic className="h-5 w-5" />,
    color: "from-pink-400 to-rose-400",
  },
  writing: {
    label: "写作",
    icon: <PenTool className="h-5 w-5" />,
    color: "from-purple-400 to-indigo-400",
  },
  reading: {
    label: "阅读",
    icon: <Eye className="h-5 w-5" />,
    color: "from-blue-400 to-cyan-400",
  },
  listening: {
    label: "听力",
    icon: <Headphones className="h-5 w-5" />,
    color: "from-green-400 to-teal-400",
  },
};

const DIFFICULTY_LEVELS = [
  { level: 1, label: "入门", color: "text-green-600" },
  { level: 2, label: "简单", color: "text-blue-600" },
  { level: 3, label: "中等", color: "text-yellow-600" },
  { level: 4, label: "困难", color: "text-orange-600" },
  { level: 5, label: "专家", color: "text-red-600" },
];

export default function SimpleCreateQuestionPage() {
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
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<{
    tags: string[];
    difficulty: number;
    category: string;
    confidence: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI分析功能
  const analyzeQuestionWithAI = async (content: string) => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // 使用AI服务分析问题
      const analysis = AIServices.generateAutoTags(content, formData.type);
      setAiSuggestions(analysis);
      
      // 自动应用建议
      if (analysis.confidence > 0.6) {
        setFormData(prev => ({
          ...prev,
          difficulty: analysis.difficulty as typeof prev.difficulty,
          tags: Array.from(new Set([...prev.tags, ...analysis.tags.slice(0, 3)])),
          type: analysis.category as any || prev.type
        }));
        
        toast.success('✨ AI分析完成！已自动优化标签和难度', {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '16px',
          }
        });
      }
    } catch (error) {
      toast.error('AI分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) newErrors.type = "请选择题目类型";
    if (!formData.title.trim()) newErrors.title = "请输入题目标题";
    if (!formData.content.trim()) newErrors.content = "请输入题目内容";
    if (!formData.correctAnswer.trim()) newErrors.correctAnswer = "请输入正确答案";
    if (!formData.userAnswer.trim()) newErrors.userAnswer = "请输入你的答案";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("请填写必填项");
      return;
    }

    try {
      const questionData = {
        title: formData.title,
        content: formData.content,
        question_type: formData.type as "speaking" | "writing" | "reading" | "listening",
        correct_answer: formData.correctAnswer,
        user_answer: formData.userAnswer,
        explanation: formData.explanation,
        difficulty_level: formData.difficulty,
        tags: formData.tags,
      };

      await createQuestion(questionData).unwrap();

      toast.success("✅ 错题保存成功！已安排复习计划", {
        duration: 3000,
        icon: "🎉",
      });

      router.push('/questions');
      
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.message || "保存失败，请重试";
      toast.error(errorMessage);
      console.error("保存错题失败:", error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  快速添加错题
                </h1>
                <p className="text-gray-600 mt-1">简化版错题录入，快速高效</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <span className="text-sm text-gray-500">
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 题目类型 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">题目类型 *</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(QUESTION_TYPES).map(([key, type]) => (
                <motion.button
                  key={key}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData(prev => ({ ...prev, type: key as any }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === key
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`p-3 bg-gradient-to-r ${type.color} rounded-xl mb-3 mx-auto w-fit`}>
                    {type.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
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

          {/* 基本信息 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  题目标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="给你的错题起个有意义的标题..."
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  题目内容 *
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="详细描述题目内容..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.content ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  
                  {/* AI分析按钮 */}
                  <div className="mt-3 flex items-center justify-between">
                    {errors.content && (
                      <p className="text-sm text-red-600">{errors.content}</p>
                    )}
                    
                    {formData.content.trim() && (
                      <motion.button
                        type="button"
                        onClick={() => analyzeQuestionWithAI(formData.content)}
                        disabled={isAnalyzing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="ml-auto flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            AI分析中...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            ✨ AI智能分析
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 答案对比 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">答案对比</h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏆 正确答案 *
                </label>
                <textarea
                  rows={4}
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="输入正确的答案..."
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.correctAnswer ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.correctAnswer && (
                  <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ❌ 我的答案 *
                </label>
                <textarea
                  rows={4}
                  value={formData.userAnswer}
                  onChange={(e) => setFormData(prev => ({ ...prev, userAnswer: e.target.value }))}
                  placeholder="输入你当时的答案..."
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.userAnswer ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.userAnswer && (
                  <p className="text-red-500 text-sm mt-1">{errors.userAnswer}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💡 解析说明
              </label>
              <textarea
                rows={3}
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="输入详细的解析、学习要点..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 难度和标签 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">附加信息</h3>
            
            {/* 难度 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                难度等级
              </label>
              <div className="flex flex-wrap gap-3">
                {DIFFICULTY_LEVELS.map((item) => (
                  <motion.button
                    key={item.level}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, difficulty: item.level as any }))}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.difficulty === item.level
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      {[...Array(item.level)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 标签 */}
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
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="输入标签，按 Enter 添加"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="text-center">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-3"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  保存错题
                </>
              )}
            </motion.button>

            <p className="text-sm text-gray-500 mt-4">
              🎯 保存后系统将自动为你安排复习计划
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}