'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetQuestionTypeByCodeQuery, useStartPracticeSessionMutation } from '@/lib/store/pteApi';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export default function PTEPracticeSetupPage() {
  const params = useParams();
  const router = useRouter();
  const moduleCode = params.moduleCode as string;
  const typeCode = params.typeCode as string;

  const { data, isLoading } = useGetQuestionTypeByCodeQuery(typeCode);
  const [startPractice, { isLoading: isStarting }] = useStartPracticeSessionMutation();

  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [questionCount, setQuestionCount] = useState(10);

  const handleStartPractice = async () => {
    if (!data?.question_type) return;

    try {
      const result = await startPractice({
        question_type_id: data.question_type.id,
        mode,
        question_count: questionCount,
      }).unwrap();

      // 跳转到练习会话页面
      router.push(`/pte/${moduleCode}/${typeCode}/session/${result.session.id}`);
    } catch (error) {
      console.error('Failed to start practice:', error);
      alert('开始练习失败，请稍后重试');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!data?.question_type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>题型不存在</p>
        </div>
      </div>
    );
  }

  const questionType = data.question_type;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          返回
        </button>

        {/* 题型信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          <div
            className="p-8 text-white"
            style={{ backgroundColor: questionType.module?.color || '#4F46E5' }}
          >
            <h1 className="text-3xl font-bold mb-2">{questionType.name_cn}</h1>
            <p className="text-lg opacity-90">{questionType.name}</p>
          </div>

          <div className="p-8">
            <p className="text-gray-700 mb-6">{questionType.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">时间限制</div>
                  <div className="text-lg font-semibold">{questionType.time_limit}秒</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">考试题数</div>
                  <div className="text-lg font-semibold">{questionType.question_count}题</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">题库题数</div>
                  <div className="text-lg font-semibold">{questionType.total_questions}题</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 练习设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">练习设置</h2>

          {/* 模式选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              练习模式
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('practice')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  mode === 'practice'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="text-lg font-semibold mb-2">练习模式</div>
                  <div className="text-sm text-gray-600">
                    优先练习错题和待复习题目，适合日常学习
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('exam')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  mode === 'exam'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="text-lg font-semibold mb-2">考试模式</div>
                  <div className="text-sm text-gray-600">
                    随机选题，模拟真实考试环境
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 题目数量 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              题目数量: {questionCount}题
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5题</span>
              <span>25题</span>
              <span>50题</span>
            </div>
          </div>

          {/* 开始按钮 */}
          <button
            onClick={handleStartPractice}
            disabled={isStarting}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>准备中...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6" />
                <span>开始练习</span>
              </>
            )}
          </button>

          {/* 提示信息 */}
          {mode === 'practice' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 练习模式会优先选择你的错题和到期需要复习的题目，帮助你更有效地巩固知识点。
              </p>
            </div>
          )}

          {mode === 'exam' && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ 考试模式将随机选题，模拟真实考试环境。答错的题目会自动加入错题本。
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
