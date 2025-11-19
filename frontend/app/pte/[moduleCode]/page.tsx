'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetModuleByCodeQuery } from '@/lib/store/pteApi';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ClockIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function PTEModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleCode = params.moduleCode as string;

  const { data, isLoading, error } = useGetModuleByCodeQuery(moduleCode);

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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>加载失败，请稍后重试</p>
        </div>
      </div>
    );
  }

  const module = data.module;
  const questionTypes = module.question_types || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回
          </button>
          <div className="flex items-center space-x-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: module.color }}
            >
              {module.name_cn[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{module.name_cn}</h1>
              <p className="text-gray-600 mt-1">{module.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 题型列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-6">
          {questionTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                {/* 题型头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{type.name_cn}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        {type.name}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{type.description}</p>

                    {/* 基本信息 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">时间限制</div>
                          <div className="font-semibold">{type.time_limit}秒</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">考试题数</div>
                          <div className="font-semibold">{type.question_count}题</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 text-gray-400">📊</div>
                        <div>
                          <div className="text-xs text-gray-500">评分权重</div>
                          <div className="font-semibold text-sm">{type.score_weight}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 text-gray-400">📚</div>
                        <div>
                          <div className="text-xs text-gray-500">题库题数</div>
                          <div className="font-semibold">{type.total_questions}题</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/pte/${moduleCode}/${type.code}`)}
                    className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>开始练习</span>
                  </button>
                </div>

                {/* 详细信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 测试技能 */}
                  {type.skills_tested && type.skills_tested.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-purple-600">🎯</div>
                        <h4 className="font-semibold text-gray-900">测试技能</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {type.skills_tested.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 评分信息 */}
                  {type.scoring_info && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-green-600">📝</div>
                        <h4 className="font-semibold text-gray-900">评分说明</h4>
                      </div>
                      <p className="text-sm text-gray-600">{type.scoring_info}</p>
                    </div>
                  )}
                </div>

                {/* 做题技巧 */}
                {type.tips && type.tips.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-semibold text-gray-900">做题技巧</h4>
                    </div>
                    <ul className="space-y-2">
                      {type.tips.map((tip, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-yellow-500 mt-1">💡</span>
                          <span className="text-sm text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 常见错误 */}
                {type.common_mistakes && type.common_mistakes.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-gray-900">常见错误</h4>
                    </div>
                    <ul className="space-y-2">
                      {type.common_mistakes.map((mistake, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">⚠️</span>
                          <span className="text-sm text-gray-700">{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
