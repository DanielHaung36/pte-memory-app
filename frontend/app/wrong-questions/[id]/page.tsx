'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import {
  useGetWrongQuestionQuery,
  useUpdateWrongQuestionMutation,
  useDeleteWrongQuestionMutation,
} from '@/lib/store/wrongQuestionsApi';
import { useConfirm } from '@/hooks/useConfirm';

interface WrongQuestion {
  id: string;
  question_id: string;
  user_answer: string;
  correct_answer: string;
  error_type: string;
  error_reason: string;
  difficulty: number;
  is_resolved: boolean;
  resolved_at?: string;
  times_wrong: number;
  last_wrong_at: string;
  notes: string;
  priority: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  question: {
    id: string;
    title: string;
    content: string;
    question_type: string;
    sub_type?: string;
    difficulty_level: number;
    audio_url?: string;
    image_url?: string;
    explanation?: string;
  };
}

const ERROR_TYPES = [
  { value: 'grammar', label: '语法错误', color: 'bg-red-100 text-red-800' },
  { value: 'vocabulary', label: '词汇错误', color: 'bg-blue-100 text-blue-800' },
  { value: 'comprehension', label: '理解错误', color: 'bg-green-100 text-green-800' },
  { value: 'pronunciation', label: '发音错误', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'review_error', label: '复习错误', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: '其他', color: 'bg-gray-100 text-gray-800' },
];

const PRIORITY_LABELS = {
  1: { label: '最低', color: 'text-gray-600' },
  2: { label: '低', color: 'text-blue-600' },
  3: { label: '中', color: 'text-yellow-600' },
  4: { label: '高', color: 'text-orange-600' },
  5: { label: '最高', color: 'text-red-600' },
};

const DIFFICULTY_NAMES = {
  1: '简单',
  2: '中等',
  3: '困难', 
  4: '很难',
  5: '专家',
};

export default function WrongQuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const wrongQuestionId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    error_reason: '',
    notes: '',
    priority: 1,
    tags: [] as string[],
    error_type: 'other',
  });

  // RTK Query hooks
  const { data: wrongQuestionData, isLoading } = useGetWrongQuestionQuery(wrongQuestionId, {
    skip: !wrongQuestionId,
  });
  const [updateWrongQuestion] = useUpdateWrongQuestionMutation();
  const [deleteWrongQuestion] = useDeleteWrongQuestionMutation();
  const { confirm, ConfirmationDialog } = useConfirm();

  const wrongQuestion = wrongQuestionData?.wrong_question;

  // 初始化编辑表单
  useEffect(() => {
    if (wrongQuestion && !isEditing) {
      setEditForm({
        error_reason: wrongQuestion.error_reason || '',
        notes: wrongQuestion.notes || '',
        priority: wrongQuestion.priority || 1,
        tags: wrongQuestion.tags || [],
        error_type: wrongQuestion.error_type || 'other',
      });
    }
  }, [wrongQuestion, isEditing]);

  const handleSave = async () => {
    try {
      await updateWrongQuestion({
        id: wrongQuestionId,
        data: editForm
      }).unwrap();
      setIsEditing(false);
      toast.success('错题更新成功');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleCancel = () => {
    if (wrongQuestion) {
      setEditForm({
        error_reason: wrongQuestion.error_reason || '',
        notes: wrongQuestion.notes || '',
        priority: wrongQuestion.priority || 1,
        tags: wrongQuestion.tags || [],
        error_type: wrongQuestion.error_type || 'other',
      });
    }
    setIsEditing(false);
  };

  const handleMarkResolved = async (resolved: boolean) => {
    try {
      await updateWrongQuestion({
        id: wrongQuestionId,
        data: { is_resolved: resolved }
      }).unwrap();
      toast.success(`错题已标记为${resolved ? '已解决' : '未解决'}`);
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "删除错题记录",
      message: "确定要删除这个错题记录吗？删除后无法恢复！",
      type: "danger",
      confirmText: "确认删除",
      cancelText: "取消"
    });
    
    if (confirmed) {
      try {
        await deleteWrongQuestion(wrongQuestionId).unwrap();
        toast.success('错题已删除');
        router.push('/wrong-questions');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const addTag = (tag: string) => {
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!wrongQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">错题不存在</h3>
          <p className="mt-2 text-gray-500">该错题可能已被删除</p>
          <button
            onClick={() => router.push('/wrong-questions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回错题列表
          </button>
        </div>
      </div>
    );
  }

  const selectedErrorType = ERROR_TYPES.find(type => type.value === wrongQuestion.error_type) || ERROR_TYPES[ERROR_TYPES.length - 1];
  const priorityInfo = PRIORITY_LABELS[wrongQuestion.priority as keyof typeof PRIORITY_LABELS];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/wrong-questions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">错题详情</h1>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                编辑
              </button>
              <button
                onClick={() => handleMarkResolved(!wrongQuestion.is_resolved)}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${ 
                  wrongQuestion.is_resolved
                    ? 'text-gray-600 border border-gray-600 hover:bg-gray-50'
                    : 'text-green-600 border border-green-600 hover:bg-green-50'
                }`}
              >
                <CheckIcon className="h-4 w-4" />
                {wrongQuestion.is_resolved ? '标记未解决' : '标记已解决'}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                删除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-600 rounded hover:bg-gray-50 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                取消
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 问题信息 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">关联题目</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{wrongQuestion.question.title}</h3>
                <p className="text-gray-600 mt-1">{wrongQuestion.question.content}</p>
              </div>

              {wrongQuestion.question.audio_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">音频</label>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      <PlayIcon className="h-4 w-4" />
                      播放音频
                    </button>
                  </div>
                </div>
              )}

              {wrongQuestion.question.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
                  <img 
                    src={wrongQuestion.question.image_url} 
                    alt="Question image"
                    className="max-w-md rounded border"
                  />
                </div>
              )}

              {wrongQuestion.question.explanation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">题目解析</label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded">{wrongQuestion.question.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* 错误分析 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">错误分析</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">你的答案</label>
                <p className="text-red-600 font-medium bg-red-50 p-3 rounded">
                  {wrongQuestion.user_answer || '未记录'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">正确答案</label>
                <p className="text-green-600 font-medium bg-green-50 p-3 rounded">
                  {wrongQuestion.correct_answer}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">错误原因</label>
              {isEditing ? (
                <textarea
                  value={editForm.error_reason}
                  onChange={(e) => setEditForm(prev => ({...prev, error_reason: e.target.value}))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="分析错误原因..."
                />
              ) : (
                <p className="text-gray-800 bg-gray-50 p-3 rounded">
                  {wrongQuestion.error_reason || '暂无分析'}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">个人备注</label>
              {isEditing ? (
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({...prev, notes: e.target.value}))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="添加个人备注..."
                />
              ) : (
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  {wrongQuestion.notes || '暂无备注'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 状态信息 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">状态信息</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">解决状态:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  wrongQuestion.is_resolved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {wrongQuestion.is_resolved ? '已解决' : '未解决'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">错误类型:</span>
                {isEditing ? (
                  <select
                    value={editForm.error_type}
                    onChange={(e) => setEditForm(prev => ({...prev, error_type: e.target.value}))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ERROR_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-sm font-medium ${selectedErrorType.color}`}>
                    {selectedErrorType.label}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">优先级:</span>
                {isEditing ? (
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({...prev, priority: parseInt(e.target.value)}))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([value, info]) => (
                      <option key={value} value={value}>{info.label} ({value})</option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-sm font-medium ${priorityInfo?.color || 'text-gray-600'}`}>
                    {priorityInfo?.label || '未知'} ({wrongQuestion.priority})
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">错误次数:</span>
                <span className="text-sm font-medium text-red-600">{wrongQuestion.times_wrong} 次</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">难度:</span>
                <span className="text-sm font-medium text-blue-600">
                  {DIFFICULTY_NAMES[wrongQuestion.difficulty as keyof typeof DIFFICULTY_NAMES] || '未知'}
                </span>
              </div>
            </div>
          </div>

          {/* 标签管理 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">标签</h3>
            
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {editForm.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(index)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="添加标签后按回车"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      addTag(target.value.trim());
                      target.value = '';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {wrongQuestion.tags?.length > 0 ? (
                  wrongQuestion.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">暂无标签</span>
                )}
              </div>
            )}
          </div>

          {/* 时间信息 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">时间记录</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">创建时间:</span>
                <p className="text-gray-800">{new Date(wrongQuestion.created_at).toLocaleString()}</p>
              </div>
              
              <div>
                <span className="text-gray-500">最后错误:</span>
                <p className="text-gray-800">{new Date(wrongQuestion.last_wrong_at).toLocaleString()}</p>
              </div>
              
              {wrongQuestion.resolved_at && (
                <div>
                  <span className="text-gray-500">解决时间:</span>
                  <p className="text-green-600">{new Date(wrongQuestion.resolved_at).toLocaleString()}</p>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">更新时间:</span>
                <p className="text-gray-800">{new Date(wrongQuestion.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationDialog />
    </div>
  );
}