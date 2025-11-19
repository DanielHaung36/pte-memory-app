'use client';

import { useGetModuleOverviewQuery } from '@/lib/store/pteApi';
import { useGetMeQuery } from '@/lib/store/authApi';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  MicrophoneIcon,
  PencilIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const moduleIcons = {
  speaking: MicrophoneIcon,
  writing: PencilIcon,
  reading: BookOpenIcon,
  listening: SpeakerWaveIcon,
};

export default function PTEModulesPage() {
  const router = useRouter();
  const { data: userData } = useGetMeQuery();
  const isLoggedIn = !!userData?.user;

  // 只在登录后才调用需要认证的API
  const { data, isLoading, error } = useGetModuleOverviewQuery(undefined, {
    skip: !isLoggedIn,
  });

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
          <p className="text-gray-600 mb-6">
            请先登录以查看PTE学习模块和个人统计数据
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载PTE模块...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>加载失败，请稍后重试</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">PTE学习中心</h1>
            <p className="text-lg text-gray-600">
              系统化学习PTE各个模块，掌握考试技巧
            </p>
          </div>
        </div>
      </div>

      {/* 模块卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {overview.map((item, index) => {
            const Icon = moduleIcons[item.module.code as keyof typeof moduleIcons] || BookOpenIcon;
            const stats = item.stats;

            return (
              <motion.div
                key={item.module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/pte/${item.module.code}`)}
              >
                {/* 模块头部 */}
                <div
                  className={`p-6 text-white`}
                  style={{ backgroundColor: item.module.color }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{item.module.name_cn}</h2>
                        <p className="text-sm opacity-90">{item.module.name}</p>
                      </div>
                    </div>
                    {stats && (
                      <div className="text-right">
                        <div className="text-3xl font-bold">{stats.mastery_level}%</div>
                        <div className="text-sm opacity-90">掌握度</div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm opacity-90">{item.module.description}</p>
                </div>

                {/* 统计数据 */}
                {stats ? (
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">完成题数</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.completed_questions}/{stats.total_questions}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">准确率</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.accuracy_rate.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">平均分</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.average_score.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">学习时长</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {Math.floor(stats.total_time_spent / 60)}分钟
                        </div>
                      </div>
                    </div>

                    {stats.last_practice_date && (
                      <div className="col-span-2 mt-2 text-sm text-gray-500">
                        最后练习: {new Date(stats.last_practice_date).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">还没有开始练习</p>
                      <button
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/pte/${item.module.code}`);
                        }}
                      >
                        开始练习
                      </button>
                    </div>
                  </div>
                )}

                {/* 题型数量 */}
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">
                      包含 <span className="font-semibold text-gray-900">{item.module.question_types?.length || 0}</span> 种题型
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
