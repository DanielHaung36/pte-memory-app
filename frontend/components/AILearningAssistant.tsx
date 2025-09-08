'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  BookOpen,
  Clock,
  Star,
  Lightbulb,
  BarChart3,
  Zap
} from 'lucide-react';
import { AIServices, LearningInsight } from '@/lib/ai-services';

interface AILearningAssistantProps {
  userStats: any;
  userProgress: any[];
  knowledgeNodes: any[];
  recentPerformance: any[];
  onRecommendationClick?: (recommendation: any) => void;
}

const AILearningAssistant: React.FC<AILearningAssistantProps> = ({
  userStats,
  userProgress,
  knowledgeNodes,
  recentPerformance,
  onRecommendationClick
}) => {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [knowledgeGaps, setKnowledgeGaps] = useState<any>(null);
  const [studySchedule, setStudySchedule] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    analyzeUserData();
  }, [userStats, userProgress, recentPerformance]);

  const analyzeUserData = async () => {
    setIsAnalyzing(true);
    
    try {
      // Generate learning insights
      const generatedInsights = AIServices.generateStudyRecommendations(userStats);
      setInsights(generatedInsights);

      // Analyze knowledge gaps
      const gaps = AIServices.analyzeKnowledgeGaps(userProgress, knowledgeNodes);
      setKnowledgeGaps(gaps);

      // Optimize study schedule
      const schedule = AIServices.optimizeStudySchedule(recentPerformance);
      setStudySchedule(schedule);
      
      setTimeout(() => setIsAnalyzing(false), 1000); // Smooth loading transition
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setIsAnalyzing(false);
    }
  };

  const nextInsight = () => {
    setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentInsightIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="text-green-500" />;
      case 'weakness': return <AlertCircle className="text-red-500" />;
      case 'suggestion': return <Lightbulb className="text-blue-500" />;
      default: return <Brain className="text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200';
      case 'weakness': return 'bg-red-50 border-red-200';
      case 'suggestion': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-8 w-8 text-blue-500" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI学习助手分析中...</h3>
            <p className="text-sm text-gray-500">正在分析您的学习数据并生成个性化建议</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Insights Carousel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="h-6 w-6 text-blue-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900">AI学习洞察</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevInsight}
              disabled={insights.length <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              ←
            </button>
            <span className="text-sm text-gray-500">
              {currentInsightIndex + 1} / {insights.length}
            </span>
            <button
              onClick={nextInsight}
              disabled={insights.length <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              →
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {insights.length > 0 && (
            <motion.div
              key={currentInsightIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-lg border ${getInsightColor(insights[currentInsightIndex]?.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insights[currentInsightIndex]?.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {insights[currentInsightIndex]?.message}
                  </h4>
                  <div className="space-y-1">
                    {insights[currentInsightIndex]?.actionItems.map((action, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Knowledge Gaps Analysis */}
      {knowledgeGaps && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">知识薄弱环节</h3>
          </div>
          
          {knowledgeGaps.criticalGaps.length > 0 ? (
            <div className="space-y-3">
              {knowledgeGaps.criticalGaps.slice(0, 3).map((gap: any, index: number) => (
                <motion.div
                  key={gap.node.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-gray-900">{gap.node.name}</span>
                      <span className="text-xs px-2 py-1 bg-orange-200 text-orange-700 rounded">
                        Level {gap.node.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{gap.node.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {(gap.masteryLevel * 100).toFixed(0)}% 掌握
                    </div>
                    <div className="w-16 bg-orange-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${gap.masteryLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  改进建议
                </h4>
                <ul className="space-y-1">
                  {knowledgeGaps.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-700 flex items-center">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mr-2" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>太棒了！没有发现明显的知识薄弱环节</p>
            </div>
          )}
        </div>
      )}

      {/* Optimized Study Schedule */}
      {studySchedule && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">最佳学习时间</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {studySchedule.optimalTime}
              </div>
              <div className="text-sm text-purple-700">最佳学习时段</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {studySchedule.recommendations.suggestedDuration}分钟
              </div>
              <div className="text-sm text-green-700">建议学习时长</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(studySchedule.recommendations.bestAccuracy * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-blue-700">该时段平均准确率</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">个性化建议</span>
            </div>
            <p className="text-sm text-gray-600">
              根据您的学习数据，建议在{studySchedule.optimalTime}进行学习，
              单次学习时长{studySchedule.recommendations.suggestedDuration}分钟，
              每周目标{Math.round(studySchedule.recommendations.weeklyGoal / 7)}次学习会话。
            </p>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {((userStats?.overall_accuracy || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">总体准确率</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {userStats?.study_streak || 0}
          </div>
          <div className="text-sm text-gray-500">连续学习天数</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {userProgress.filter(p => p.mastery_level > 0.8).length}
          </div>
          <div className="text-sm text-gray-500">已掌握技能</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {userStats?.total_questions || 0}
          </div>
          <div className="text-sm text-gray-500">总练习题数</div>
        </motion.div>
      </div>
    </div>
  );
};

export default AILearningAssistant;