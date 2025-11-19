"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  AlertCircle,
  Upload,
  Play,
  Volume2,
  Star,
  Tag,
  Clock,
  FileText,
  Mic,
  PenTool,
  Eye,
  Headphones,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useGetQuestionQuery, useUpdateQuestionMutation, useDeleteQuestionMutation } from "@/lib/store/questionsApi";
import { toast } from "react-hot-toast";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { useConfirm } from "@/hooks/useConfirm";

const QUESTION_TYPES = {
  speaking: { label: "口语", icon: <Mic className="h-4 w-4" />, color: "text-pink-600 bg-pink-100" },
  writing: { label: "写作", icon: <PenTool className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
  reading: { label: "阅读", icon: <Eye className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
  listening: { label: "听力", icon: <Headphones className="h-4 w-4" />, color: "text-green-600 bg-green-100" },
};

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  
  const { data: questionData, isLoading: questionLoading, error } = useGetQuestionQuery(questionId);
  const [updateQuestion, { isLoading: updating }] = useUpdateQuestionMutation();
  const [deleteQuestion, { isLoading: deleting }] = useDeleteQuestionMutation();
  const { confirm, ConfirmationDialog } = useConfirm();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    question_type: "speaking",
    difficulty_level: 1,
    audio_url: "",
    tags: [] as string[],
    explanations: "",
  });
  
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Load question data when available
  useEffect(() => {
    if (questionData?.question) {
      const question = questionData.question;
      setFormData({
        title: question.title || "",
        content: question.content || "",
        question_type: question.question_type || "speaking",
        difficulty_level: question.difficulty_level || 1,
        audio_url: question.audio_url || "",
        tags: question.tags || [],
        explanations: question.explanations || "",
      });
    }
  }, [questionData]);

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">加载题目信息中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">题目不存在</h2>
            <p className="text-gray-600 mb-4">该题目可能已被删除或不存在</p>
            <Link href="/questions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回题库
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "题目标题不能为空";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "题目内容不能为空";
    }
    
    if (formData.difficulty_level < 1 || formData.difficulty_level > 5) {
      newErrors.difficulty_level = "难度等级必须在1-5之间";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateQuestion({
        id: questionId,
        ...formData,
      }).unwrap();
      
      toast.success("题目更新成功！", {
        icon: "✅",
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });
      
      router.push("/questions");
    } catch (error) {
      toast.error("更新失败，请重试", {
        icon: "❌",
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "删除题目",
      message: "确定要删除这道题目吗？删除后无法恢复！",
      type: "danger",
      confirmText: "确认删除",
      cancelText: "取消"
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteQuestion(questionId).unwrap();
      
      toast.success("题目删除成功", {
        icon: "🗑️",
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });
      
      router.push("/questions");
    } catch (error) {
      toast.error("删除失败，请重试", {
        icon: "❌",
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const question = questionData?.question;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/questions">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">编辑题目</h1>
                <p className="text-gray-600">修改题目内容和设置</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                删除题目
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="输入题目标题..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目类型 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(QUESTION_TYPES).map(([type, config]) => (
                    <motion.button
                      key={type}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, question_type: type }))}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${
                        formData.question_type === type
                          ? `${config.color} border-current`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {config.icon}
                      <span className="text-sm font-medium">{config.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度等级 *
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {getDifficultyStars(formData.difficulty_level)}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>简单</span>
                    <span>中等</span>
                    <span>困难</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">题目内容</h2>
            </div>

            <div className="space-y-6">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.content ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="输入题目详细内容..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              {/* Explanations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解析说明
                </label>
                <textarea
                  value={formData.explanations}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanations: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="添加题目解析或说明..."
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">附加设置</h2>
            </div>

            <div className="space-y-6">
              {/* Audio URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音频链接
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={formData.audio_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, audio_url: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="https://example.com/audio.mp3"
                  />
                  {formData.audio_url && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>试听</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="输入标签..."
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      添加
                    </motion.button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-blue-900 transition-colors"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-end space-x-4"
          >
            <Link href="/questions">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </motion.button>
            </Link>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={updating}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {updating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              保存修改
            </motion.button>
          </motion.div>
        </form>
      </div>
      <ConfirmationDialog />
    </div>
  );
}