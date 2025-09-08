"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  BookOpen,
  Zap,
  Target,
  TrendingUp,
  Heart,
  Star,
  Sparkles,
  ArrowRight,
  Play,
  Users,
  Clock,
  Trophy,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.4, 1, 1.4],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-fuchsia-400/15 to-pink-400/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [-50, 50, -50],
            x: [-30, 30, -30],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl"
        />
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                PTE记忆助手
              </h1>
              <p className="text-xs text-gray-500">智能学习，科学复习</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link
              href="/auth/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              登录
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              免费注册
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full text-sm font-medium text-violet-700 mb-6 border border-violet-200/50">
              <Sparkles className="w-4 h-4 mr-2" />
              基于艾宾浩斯遗忘曲线的智能复习系统
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight">
                让记忆
              </span>
              <br />
              <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent leading-tight">
                更持久
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              专为PTE/雅思考生打造的智能错题管理系统
              <br />
              <span className="text-violet-600 font-semibold">科学复习</span> ·
              <span className="text-purple-600 font-semibold">实时同步</span> ·
              <span className="text-fuchsia-600 font-semibold">游戏化学习</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-violet-500/25 transform transition-all duration-300 flex items-center gap-2 group"
                >
                  <Play className="w-5 h-5" />
                  立即开始免费试用
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="#features"
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center gap-2 border border-gray-200/50"
                >
                  <BookOpen className="w-5 h-5" />
                  了解功能特色
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* 统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            {[
              {
                icon: Users,
                label: "注册用户",
                value: "10,000+",
                color: "text-violet-600",
              },
              {
                icon: BookOpen,
                label: "练习题目",
                value: "50,000+",
                color: "text-purple-600",
              },
              {
                icon: Clock,
                label: "学习时长",
                value: "100万+",
                color: "text-fuchsia-600",
              },
              {
                icon: Trophy,
                label: "通过率",
                value: "95%+",
                color: "text-pink-600",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`w-12 h-12 ${stat.color} bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 功能特色区域 */}
        <section id="features" className="pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                为什么选择我们？
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              集成最新的学习科学研究成果，为您提供最高效的记忆训练方案
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "智能复习算法",
                description:
                  "基于SM-2算法的艾宾浩斯遗忘曲线，科学安排复习时间，让记忆更持久",
                color: "from-violet-500 to-purple-500",
                features: ["智能间隔重复", "难度自适应", "遗忘曲线追踪"],
              },
              {
                icon: Zap,
                title: "实时同步体验",
                description:
                  "WebSocket技术确保所有设备数据实时同步，随时随地无缝学习",
                color: "from-purple-500 to-fuchsia-500",
                features: ["多设备同步", "实时状态更新", "离线数据保护"],
              },
              {
                icon: Target,
                title: "个性化学习",
                description:
                  "根据个人学习情况量身定制复习计划，提供精准的学习建议",
                color: "from-fuchsia-500 to-pink-500",
                features: ["学习路径规划", "弱项针对训练", "进度智能分析"],
              },
              {
                icon: TrendingUp,
                title: "数据可视化",
                description: "详细的学习统计和进度分析，让您清楚了解学习成效",
                color: "from-pink-500 to-rose-500",
                features: ["学习报表", "趋势分析", "成绩预测"],
              },
              {
                icon: Heart,
                title: "游戏化设计",
                description: "通过等级、徽章、连击等游戏元素，让学习变得更有趣",
                color: "from-rose-500 to-orange-500",
                features: ["等级系统", "成就徽章", "连击挑战"],
              },
              {
                icon: Star,
                title: "四大题型覆盖",
                description:
                  "全面覆盖PTE/雅思听说读写四大题型，一站式备考解决方案",
                color: "from-orange-500 to-yellow-500",
                features: ["听力练习", "口语训练", "阅读理解", "写作指导"],
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h4 className="text-xl font-bold text-gray-800 mb-4">
                  {feature.title}
                </h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA区域 */}
        <section className="text-center pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-3xl p-12 shadow-2xl"
          >
            <div className="max-w-3xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
                开启您的智能学习之旅
              </h3>
              <p className="text-xl text-violet-100 mb-8">
                加入数万名考生的选择，让科学的方法助您轻松通过PTE/雅思考试
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/auth/register"
                    className="px-8 py-4 bg-white text-violet-600 font-bold rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 flex items-center gap-2 group"
                  >
                    <Sparkles className="w-5 h-5" />
                    免费开始使用
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                <p className="text-violet-100 text-sm">
                  ✨ 无需信用卡 · 30天免费试用 · 随时可取消
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* 页脚 */}
      <footer className="relative z-10 bg-white/50 backdrop-blur-lg border-t border-white/20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              PTE记忆助手
            </span>
          </div>

          <p className="text-gray-600 mb-4">
            让每一次学习都更有意义，让每一份努力都获得回报
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span>© 2024 PTE记忆助手</span>
            <span>·</span>
            <span>隐私政策</span>
            <span>·</span>
            <span>服务条款</span>
            <span>·</span>
            <span>联系我们</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
