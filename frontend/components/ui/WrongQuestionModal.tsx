"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Volume2, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import TTSButton from "./TTSButton";
import { useUpdateWrongQuestionMutation, useDeleteWrongQuestionMutation } from "@/lib/store/wrongQuestionsApi";

interface WrongQuestion {
  id: string
  user_id: string
  question_id: string
  user_answer: string
  correct_answer: string
  error_type: string
  error_reason: string
  difficulty: number
  is_resolved: boolean
  resolved_at?: string
  times_wrong: number
  last_wrong_at: string
  notes: string
  priority: number
  tags: string[]
  created_at: string
  updated_at: string
  question?: any
}

interface WrongQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrongQuestion: WrongQuestion;
  mode: 'view' | 'edit';
  onDelete?: (id: string) => void;
}

const errorTypes = [
  "grammar", "vocabulary", "spelling", "pronunciation", 
  "understanding", "time_management", "careless", "other"
];

const priorityLevels = [
  { value: 1, label: "低", color: "bg-green-100 text-green-800" },
  { value: 2, label: "中", color: "bg-yellow-100 text-yellow-800" },
  { value: 3, label: "高", color: "bg-red-100 text-red-800" },
];

export default function WrongQuestionModal({
  isOpen,
  onClose,
  wrongQuestion,
  mode: initialMode = 'view',
  onDelete
}: WrongQuestionModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    error_reason: wrongQuestion.error_reason,
    notes: wrongQuestion.notes,
    priority: wrongQuestion.priority,
    tags: wrongQuestion.tags,
    is_resolved: wrongQuestion.is_resolved,
  });

  const [updateWrongQuestion, { isLoading: isUpdating }] = useUpdateWrongQuestionMutation();
  const [deleteWrongQuestion, { isLoading: isDeleting }] = useDeleteWrongQuestionMutation();

  useEffect(() => {
    setMode(initialMode);
    setFormData({
      error_reason: wrongQuestion.error_reason,
      notes: wrongQuestion.notes,
      priority: wrongQuestion.priority,
      tags: wrongQuestion.tags,
      is_resolved: wrongQuestion.is_resolved,
    });
  }, [wrongQuestion, initialMode]);

  const handleSave = async () => {
    try {
      await updateWrongQuestion({
        id: wrongQuestion.id,
        data: formData
      }).unwrap();
      setMode('view');
    } catch (error) {
      console.error('Failed to update wrong question:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这道错题吗？')) return;
    
    try {
      await deleteWrongQuestion(wrongQuestion.id).unwrap();
      onDelete?.(wrongQuestion.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete wrong question:', error);
    }
  };

  const handleResolve = async () => {
    try {
      await updateWrongQuestion({
        id: wrongQuestion.id,
        data: { is_resolved: !wrongQuestion.is_resolved }
      }).unwrap();
    } catch (error) {
      console.error('Failed to resolve wrong question:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'edit' ? '编辑错题' : '错题详情'}
              </h2>
              <Badge 
                className={priorityLevels.find(p => p.value === wrongQuestion.priority)?.color}
              >
                {priorityLevels.find(p => p.value === wrongQuestion.priority)?.label}优先级
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {mode === 'view' && (
                <Button
                  onClick={() => setMode('edit')}
                  variant="outline"
                  size="sm"
                >
                  编辑
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Question Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">错误类型</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{wrongQuestion.error_type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">错误次数</Label>
                  <div className="mt-1 text-lg font-semibold text-red-600">
                    {wrongQuestion.times_wrong} 次
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">你的答案</Label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                    <span className="text-red-800">{wrongQuestion.user_answer}</span>
                    <TTSButton text={wrongQuestion.user_answer} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">正确答案</Label>
                  <div className="mt-1 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                    <span className="text-green-800">{wrongQuestion.correct_answer}</span>
                    <TTSButton text={wrongQuestion.correct_answer} />
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">错误原因</Label>
                {mode === 'edit' ? (
                  <Textarea
                    value={formData.error_reason}
                    onChange={(e) => setFormData({ ...formData, error_reason: e.target.value })}
                    placeholder="描述错误原因..."
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {wrongQuestion.error_reason || '暂无描述'}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">学习笔记</Label>
                {mode === 'edit' ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="记录学习心得、解题技巧等..."
                    className="mt-1"
                    rows={4}
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {wrongQuestion.notes || '暂无笔记'}
                  </div>
                )}
              </div>

              {mode === 'edit' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">优先级</Label>
                  <Select 
                    value={formData.priority.toString()}
                    onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}优先级
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium text-gray-700">标签</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {wrongQuestion.tags.length > 0 ? (
                    wrongQuestion.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">暂无标签</span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-500">
              <div>创建时间: {new Date(wrongQuestion.created_at).toLocaleString('zh-CN')}</div>
              <div>最后错误时间: {new Date(wrongQuestion.last_wrong_at).toLocaleString('zh-CN')}</div>
              {wrongQuestion.resolved_at && (
                <div>解决时间: {new Date(wrongQuestion.resolved_at).toLocaleString('zh-CN')}</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div>
              <Button
                onClick={handleResolve}
                variant={wrongQuestion.is_resolved ? "secondary" : "default"}
                className={wrongQuestion.is_resolved ? "bg-green-100 text-green-800" : ""}
              >
                {wrongQuestion.is_resolved ? '标记为未解决' : '标记为已解决'}
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
              
              {mode === 'edit' ? (
                <>
                  <Button
                    onClick={() => setMode('view')}
                    variant="outline"
                    disabled={isUpdating}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </>
              ) : (
                <Button onClick={onClose}>关闭</Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}