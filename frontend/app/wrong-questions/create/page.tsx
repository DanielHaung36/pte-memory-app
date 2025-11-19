"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Save, 
  AlertCircle,
  Search,
  Star,
  Tag,
  Clock,
  FileText,
  Mic,
  PenTool,
  Eye,
  Headphones,
  Loader2,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useGetQuestionsQuery } from "@/lib/store/questionsApi";
import { useCreateWrongQuestionMutation } from "@/lib/store/wrongQuestionsApi";
import { toast } from "react-hot-toast";
import AppNavigation from "@/components/ui/navigation/AppNavigation";

const QUESTION_TYPES = {
  speaking: { label: "口语", icon: <Mic className="h-4 w-4" />, color: "text-pink-600 bg-pink-100" },
  writing: { label: "写作", icon: <PenTool className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
  reading: { label: "阅读", icon: <Eye className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
  listening: { label: "听力", icon: <Headphones className="h-4 w-4" />, color: "text-green-600 bg-green-100" },
};

const ERROR_TYPES = [
  { value: "understanding", label: "理解错误" },
  { value: "grammar", label: "语法错误" },
  { value: "vocabulary", label: "词汇错误" },
  { value: "pronunciation", label: "发音错误" },
  { value: "fluency", label: "流利度问题" },
  { value: "structure", label: "结构错误" },
  { value: "time_management", label: "时间管理" },
  { value: "content", label: "内容相关" },
  { value: "other", label: "其他" },
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: "容易", color: "bg-green-100 text-green-800" },
  { value: 2, label: "一般", color: "bg-blue-100 text-blue-800" },
  { value: 3, label: "困难", color: "bg-yellow-100 text-yellow-800" },
  { value: 4, label: "很难", color: "bg-orange-100 text-orange-800" },
  { value: 5, label: "极难", color: "bg-red-100 text-red-800" },
];

const PRIORITY_LEVELS = [
  { value: 1, label: "低", color: "bg-gray-100 text-gray-800" },
  { value: 2, label: "中", color: "bg-blue-100 text-blue-800" },
  { value: 3, label: "高", color: "bg-orange-100 text-orange-800" },
  { value: 4, label: "紧急", color: "bg-red-100 text-red-800" },
];

export default function CreateWrongQuestionPage() {
  const router = useRouter();

  // 创建模式：'select' 从题目库选择，'manual' 手动创建
  const [createMode, setCreateMode] = useState<'select' | 'manual'>('manual');

  // 获取题目列表用于选择
  const { data: questionsData, isLoading: questionsLoading } = useGetQuestionsQuery({
    limit: 100
  });

  const [createWrongQuestion, { isLoading: creating }] = useCreateWrongQuestionMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [formData, setFormData] = useState({
    question_id: "",
    // 手动创建模式的字段
    title: "",
    content: "",
    question_type: "reading" as "speaking" | "writing" | "reading" | "listening",
    // 共同字段
    user_answer: "",
    correct_answer: "",
    error_type: "understanding",
    error_reason: "",
    difficulty: 2,
    notes: "",
    priority: 2,
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState("");

  // 筛选题目
  const filteredQuestions = questionsData?.questions?.filter(question =>
    question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证字段
    if (createMode === 'select' && !formData.question_id) {
      toast.error("请选择一个题目");
      return;
    }

    if (createMode === 'manual') {
      if (!formData.title.trim()) {
        toast.error("请填写题目标题");
        return;
      }
      if (!formData.content.trim()) {
        toast.error("请填写题目内容");
        return;
      }
    }

    if (!formData.user_answer.trim()) {
      toast.error("请填写你的答案");
      return;
    }

    if (!formData.correct_answer.trim()) {
      toast.error("请填写正确答案");
      return;
    }

    if (!formData.error_reason.trim()) {
      toast.error("请填写错误原因");
      return;
    }

    try {
      // 如果是手动创建模式，需要先创建题目
      if (createMode === 'manual') {
        // 先创建题目
        const questionResponse = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            question_type: formData.question_type,
            correct_answer: formData.correct_answer,
            user_answer: formData.user_answer,
            difficulty_level: formData.difficulty,
          })
        });

        if (!questionResponse.ok) {
          throw new Error('创建题目失败');
        }

        const questionData = await questionResponse.json();
        formData.question_id = questionData.question.id;
      }

      // 创建错题记录
      await createWrongQuestion(formData).unwrap();

      toast.success("错题创建成功", {
        icon: "✅",
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '12px',
        }
      });

      router.push("/wrong-questions");
    } catch (error) {
      console.error('创建错题失败:', error);
      toast.error("创建失败，请重试", {
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
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const selectQuestion = (question: any) => {
    setSelectedQuestion(question);
    setFormData(prev => ({
      ...prev,
      question_id: question.id
    }));
    setShowQuestionModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <AppNavigation />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-red-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/wrong-questions">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-red-300 transition-all"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </motion.button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">添加错题</h1>
                <p className="text-gray-600 mt-1">记录学习过程中遇到的错题</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 创建模式选择 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">创建方式</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setCreateMode('manual')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  createMode === 'manual'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Plus className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-gray-900">手动创建</span>
                  {createMode === 'manual' && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded">
                      当前
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  直接填写题目信息和答案，快速创建错题
                </p>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setCreateMode('select')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  createMode === 'select'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-gray-900">从题库选择</span>
                  {createMode === 'select' && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded">
                      当前
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  从已有的题目库中选择一个题目
                </p>
              </motion.button>
            </div>
          </motion.div>

          {/* 手动创建模式 - 题目信息 */}
          {createMode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">题目信息</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    题目标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="输入题目标题..."
                    required={createMode === 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    题目内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="输入题目内容..."
                    required={createMode === 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    题目类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(QUESTION_TYPES).map(([key, type]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, question_type: key as any }))}
                        className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          formData.question_type === key
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {type.icon}
                        <span className="font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 从题库选择模式 */}
          {createMode === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">选择题目</h3>
                <span className="text-red-500">*</span>
              </div>
            
              {selectedQuestion ? (
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${QUESTION_TYPES[selectedQuestion.question_type as keyof typeof QUESTION_TYPES]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {QUESTION_TYPES[selectedQuestion.question_type as keyof typeof QUESTION_TYPES]?.icon}
                          <span className="ml-1">{QUESTION_TYPES[selectedQuestion.question_type as keyof typeof QUESTION_TYPES]?.label}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${DIFFICULTY_LEVELS[selectedQuestion.difficulty_level - 1]?.color}`}>
                          {DIFFICULTY_LEVELS[selectedQuestion.difficulty_level - 1]?.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{selectedQuestion.title}</h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{selectedQuestion.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuestionModal(true)}
                      className="ml-4 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      重新选择
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-300 hover:text-red-600 transition-all"
                >
                  <Plus className="h-6 w-6 mx-auto mb-2" />
                  点击选择题目
                </button>
              )}
            </motion.div>
          )}

          {/* 答案信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <PenTool className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">答案信息</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的答案 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.user_answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_answer: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="输入你当时的答案..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  正确答案 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.correct_answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="输入正确答案..."
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* 错误分析 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">错误分析</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  错误类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.error_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, error_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  {ERROR_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  困难程度
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                错误原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.error_reason}
                onChange={(e) => setFormData(prev => ({ ...prev, error_reason: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="详细描述为什么会出错..."
                required
              />
            </div>
          </motion.div>

          {/* 其他信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">其他信息</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PRIORITY_LEVELS.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加标签
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="输入标签..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="添加其他备注信息..."
              />
            </div>
          </motion.div>

          {/* 提交按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4"
          >
            <Link href="/wrong-questions">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </motion.button>
            </Link>
            
            <motion.button
              type="submit"
              disabled={creating}
              whileHover={{ scale: creating ? 1 : 1.02 }}
              whileTap={{ scale: creating ? 1 : 0.98 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {creating ? "创建中..." : "创建错题"}
            </motion.button>
          </motion.div>
        </form>
      </div>

      {/* 题目选择模态框 */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">选择题目</h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="搜索题目..."
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {questionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((question) => (
                    <motion.div
                      key={question.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-red-300 cursor-pointer transition-all"
                      onClick={() => selectQuestion(question)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.icon}
                          <span className="ml-1">{QUESTION_TYPES[question.question_type as keyof typeof QUESTION_TYPES]?.label}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${DIFFICULTY_LEVELS[question.difficulty_level - 1]?.color}`}>
                          {DIFFICULTY_LEVELS[question.difficulty_level - 1]?.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{question.title}</h4>
                      <p className="text-gray-600 text-sm line-clamp-2">{question.content}</p>
                    </motion.div>
                  ))}
                  
                  {filteredQuestions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "未找到匹配的题目" : "暂无题目"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}