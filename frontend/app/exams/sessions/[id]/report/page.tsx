'use client'

import { use } from 'react'
import { useGetExamReportQuery } from '@/lib/store/examApi'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Radar, Bar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

export default function ExamReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: report, isLoading, error } = useGetExamReportQuery(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">生成报告中...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">加载报告失败，请稍后重试</p>
            <Link
              href="/exams/sessions"
              className="inline-block mt-4 text-indigo-600 hover:text-indigo-700"
            >
              返回考试列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 准备雷达图数据
  const radarData = {
    labels: ['口语', '写作', '阅读', '听力'],
    datasets: [
      {
        label: '得分率',
        data: [
          report.score_breakdown.speaking.percentage,
          report.score_breakdown.writing.percentage,
          report.score_breakdown.reading.percentage,
          report.score_breakdown.listening.percentage,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
      },
    ],
  }

  // 准备柱状图数据（薄弱点）
  const weakPointsData = {
    labels: report.weak_points_ranked?.map((wp) => wp.type) || [],
    datasets: [
      {
        label: '错题数量',
        data: report.weak_points_ranked?.map((wp) => wp.count) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/exams/sessions"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">考试详细报告</h1>
          <p className="text-gray-600">
            {report.exam_type} · {new Date(report.completed_at).toLocaleString('zh-CN')}
          </p>
        </div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white"
        >
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{report.overall_score.toFixed(1)}</div>
            <div className="text-xl opacity-90">总分</div>
            <div className="mt-4 flex justify-center gap-8">
              <div>
                <div className="text-3xl font-bold">{report.statistics.accuracy_rate.toFixed(1)}%</div>
                <div className="text-sm opacity-75">正确率</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{formatTime(report.time_spent)}</div>
                <div className="text-sm opacity-75">用时</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Score Breakdown Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">分项得分</h2>

            {/* Speaking */}
            {report.score_breakdown.speaking.questions_count > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">口语 (Speaking)</span>
                  <span className={`text-2xl font-bold ${getScoreColor(report.score_breakdown.speaking.percentage)}`}>
                    {report.score_breakdown.speaking.score.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${report.score_breakdown.speaking.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  正确率: {report.score_breakdown.speaking.accuracy_rate.toFixed(1)}%
                  ({report.score_breakdown.speaking.correct_count}/{report.score_breakdown.speaking.questions_count})
                </div>
              </div>
            )}

            {/* Writing */}
            {report.score_breakdown.writing.questions_count > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">写作 (Writing)</span>
                  <span className={`text-2xl font-bold ${getScoreColor(report.score_breakdown.writing.percentage)}`}>
                    {report.score_breakdown.writing.score.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${report.score_breakdown.writing.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  正确率: {report.score_breakdown.writing.accuracy_rate.toFixed(1)}%
                  ({report.score_breakdown.writing.correct_count}/{report.score_breakdown.writing.questions_count})
                </div>
              </div>
            )}

            {/* Reading */}
            {report.score_breakdown.reading.questions_count > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">阅读 (Reading)</span>
                  <span className={`text-2xl font-bold ${getScoreColor(report.score_breakdown.reading.percentage)}`}>
                    {report.score_breakdown.reading.score.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${report.score_breakdown.reading.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  正确率: {report.score_breakdown.reading.accuracy_rate.toFixed(1)}%
                  ({report.score_breakdown.reading.correct_count}/{report.score_breakdown.reading.questions_count})
                </div>
              </div>
            )}

            {/* Listening */}
            {report.score_breakdown.listening.questions_count > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">听力 (Listening)</span>
                  <span className={`text-2xl font-bold ${getScoreColor(report.score_breakdown.listening.percentage)}`}>
                    {report.score_breakdown.listening.score.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${report.score_breakdown.listening.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  正确率: {report.score_breakdown.listening.accuracy_rate.toFixed(1)}%
                  ({report.score_breakdown.listening.correct_count}/{report.score_breakdown.listening.questions_count})
                </div>
              </div>
            )}
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">能力雷达图</h2>
            <div className="h-80 flex items-center justify-center">
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">总题数</div>
            <div className="text-3xl font-bold text-gray-900">{report.statistics.total_questions}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">正确</div>
            <div className="text-3xl font-bold text-green-600">{report.statistics.correct_answers}</div>
          </div>
          <div className="bg-red-50 rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">错误</div>
            <div className="text-3xl font-bold text-red-600">{report.statistics.wrong_answers}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">跳过</div>
            <div className="text-3xl font-bold text-yellow-600">{report.statistics.skipped_questions}</div>
          </div>
        </motion.div>

        {/* Weak Points */}
        {report.weak_points_ranked && report.weak_points_ranked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">薄弱点分析</h2>
            <div className="h-64">
              <Bar
                data={weakPointsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Time Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">时间分析</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">总用时</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(report.time_analysis.total_time)}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">暂停时长</div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatTime(report.time_analysis.pause_duration)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">有效时间</div>
              <div className="text-2xl font-bold text-green-600">
                {formatTime(report.time_analysis.effective_time)}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">平均答题时间</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.time_analysis.avg_time_per_question}秒
              </div>
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        {report.suggestions && report.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              学习建议
            </h2>
            <ul className="space-y-3">
              {report.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Wrong Answers */}
        {report.wrong_answers && report.wrong_answers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">错题回顾</h2>
            <div className="space-y-4">
              {report.wrong_answers.map((answer, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">
                      题型: {answer.question_type}
                    </span>
                    <span className="text-sm text-red-600">
                      用时: {answer.time_spent}秒
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600">你的答案:</div>
                    <div className="text-gray-900 bg-white rounded p-2 mt-1">
                      {answer.user_answer || '未作答'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">正确答案:</div>
                    <div className="text-green-700 bg-green-50 rounded p-2 mt-1 font-medium">
                      {answer.correct_answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/exams/mock-test"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            再来一次
          </Link>
          <Link
            href="/exams/sessions"
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            返回列表
          </Link>
        </div>
      </div>
    </div>
  )
}
