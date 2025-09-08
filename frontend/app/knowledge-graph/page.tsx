"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import KnowledgeGraphVisualization from "@/components/KnowledgeGraphVisualization";
import { useGetQuestionsQuery } from "@/lib/store/questionsApi";
import { AIServices } from "@/lib/ai-services";
import {
  Map,
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Zap,
  Star,
  Heart,
  Sparkles,
  RefreshCw,
  Filter,
  Search,
  Eye,
  BarChart3,
} from "lucide-react";

// 模拟数据 - 在实际应用中这些将从API获取
const mockNodes = [
  {
    id: "1",
    name: "PTE听力基础",
    description: "PTE听力考试的基本概念和技巧",
    node_type: "concept",
    level: 1,
    category: "listening",
    mastery_level: 0.8,
  },
  {
    id: "2",
    name: "Summarize Spoken Text",
    description: "听力摘要题型解析",
    node_type: "skill",
    level: 3,
    category: "listening",
    mastery_level: 0.4,
  },
  {
    id: "3",
    name: "Multiple Choice",
    description: "听力选择题技巧",
    node_type: "skill",
    level: 2,
    category: "listening",
    mastery_level: 0.7,
  },
  {
    id: "4",
    name: "语音识别",
    description: "英语语音识别基础",
    node_type: "foundation",
    level: 1,
    category: "listening",
    mastery_level: 0.9,
  },
  {
    id: "5",
    name: "Essay Structure",
    description: "写作结构框架",
    node_type: "concept",
    level: 2,
    category: "writing",
    mastery_level: 0.6,
  },
  {
    id: "6",
    name: "Academic Vocabulary",
    description: "学术词汇积累",
    node_type: "knowledge",
    level: 3,
    category: "vocabulary",
    mastery_level: 0.5,
  },
];

const mockEdges = [
  {
    id: "1",
    from_node_id: "4",
    to_node_id: "1",
    edge_type: "prerequisite",
    weight: 0.9,
  },
  {
    id: "2",
    from_node_id: "1",
    to_node_id: "2",
    edge_type: "enables",
    weight: 0.8,
  },
  {
    id: "3",
    from_node_id: "1",
    to_node_id: "3",
    edge_type: "enables",
    weight: 0.7,
  },
  {
    id: "4",
    from_node_id: "6",
    to_node_id: "5",
    edge_type: "related",
    weight: 0.6,
  },
];

const mockProgress = [
  { node_id: "1", mastery_level: 0.8 },
  { node_id: "2", mastery_level: 0.4 },
  { node_id: "3", mastery_level: 0.7 },
  { node_id: "4", mastery_level: 0.9 },
  { node_id: "5", mastery_level: 0.6 },
  { node_id: "6", mastery_level: 0.5 },
];

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState<
    "overview" | "progress" | "recommendations"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nodes, setNodes] = useState(mockNodes);
  const [edges, setEdges] = useState(mockEdges);
  const [progress, setProgress] = useState(mockProgress);

  // 获取用户的错题数据
  const { data: questionsData, isLoading: questionsLoading } = useGetQuestionsQuery({ limit: 100 });

  useEffect(() => {
    // 模拟加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  // AI分析错题生成知识图谱
  const handleAIAnalysis = async () => {
    if (!questionsData?.questions.length) {
      alert('需要先完成一些错题练习才能进行AI分析');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 使用AI服务分析错题
      const analysis = AIServices.analyzeQuestionsForKnowledgeGraph(questionsData.questions);
      
      // 更新节点和洞察
      if (analysis.nodes.length > 0) {
        setNodes(analysis.nodes);
        setEdges(analysis.edges);
        setAiInsights(analysis.insights);
        
        // 构造进度数据
        const newProgress = analysis.nodes.map(node => ({
          id: node.id,
          node_id: node.id,
          mastery_level: node.masteryLevel,
          last_reviewed: new Date().toISOString(),
          next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      alert('AI分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsights = () => {
    const totalNodes = nodes.length;
    const masteredNodes = progress.filter(
      (p) => p.mastery_level > 0.8
    ).length;
    const weakNodes = progress.filter((p) => p.mastery_level < 0.5).length;
    const avgMastery = totalNodes > 0 ?
      progress.reduce((sum, p) => sum + p.mastery_level, 0) / totalNodes : 0;

    return {
      totalNodes,
      masteredNodes,
      weakNodes,
      avgMastery,
      completionRate: (masteredNodes / totalNodes) * 100,
    };
  };

  const insights = getInsights();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
            />
            <motion.p
              className="text-lg font-medium text-gray-700 mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              正在构建知识图谱...
            </motion.p>
            <p className="text-sm text-gray-500">分析知识点关联和学习进度</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 浮动装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            rotate: [0, 270, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-32 left-16 w-8 h-8 bg-gradient-to-br from-purple-300/40 to-blue-300/40 rounded-full opacity-60 blur-sm"
        />
        <motion.div
          animate={{
            x: [0, -90, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 8,
          }}
          className="absolute top-60 right-32 w-6 h-6 bg-gradient-to-br from-green-300/30 to-teal-300/30 rounded-full opacity-50 blur-sm"
        />
      </div>

      <AppNavigation />

      {/* 操作工具栏 */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.p
              className="text-gray-600 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Lightbulb className="w-4 h-4 text-emerald-500 mr-2" />
              可视化学习路径，发现知识盲区
              <Star className="w-4 h-4 text-yellow-500 ml-2" />
            </motion.p>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 rounded-lg font-medium transition-all hover:shadow-md border border-emerald-100"
              >
                <RefreshCw className="h-4 w-4 mr-2 inline" />
                刷新图谱
              </motion.button>
              
              <motion.button
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || questionsLoading}
                whileHover={{ scale: isAnalyzing ? 1 : 1.05 }}
                whileTap={{ scale: isAnalyzing ? 1 : 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"
                    />
                    AI分析中...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2 inline" />
                    🤖 AI分析错题
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">知识点总数</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {insights.totalNodes}
                </p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl"
                whileHover={{ rotate: 10 }}
              >
                <Brain className="h-6 w-6 text-purple-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已掌握</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {insights.masteredNodes}
                </p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl"
                whileHover={{ rotate: -10 }}
              >
                <Star className="h-6 w-6 text-green-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">需加强</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {insights.weakNodes}
                </p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl"
                whileHover={{ rotate: 5 }}
              >
                <Target className="h-6 w-6 text-orange-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">平均掌握度</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(insights.avgMastery * 100)}%
                </p>
              </div>
              <motion.div
                className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl"
                whileHover={{ rotate: -5 }}
              >
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 知识图谱可视化 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  交互式知识网络
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("overview")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === "overview"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2 inline" />
                  总览
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("progress")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === "progress"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2 inline" />
                  进度
                </motion.button>
              </div>
            </div>
          </div>

          <div className="relative">
            <KnowledgeGraphVisualization
              nodes={nodes}
              edges={edges}
              userProgress={progress}
              onNodeClick={handleNodeClick}
              height={600}
              interactive={true}
            />

            {/* 学习建议浮窗 */}
            <AnimatePresence>
              {insights.weakNodes > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg max-w-sm"
                >
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm">学习建议</h3>
                      <p className="text-xs mt-1 opacity-90">
                        发现 {insights.weakNodes}{" "}
                        个薄弱知识点，建议优先学习这些基础概念
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* AI洞察显示 */}
        {aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-bold text-gray-900">
                  🤖 AI智能分析洞察
                </h3>
                <p className="text-sm text-gray-600">
                  基于您的错题数据生成的个性化学习建议
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                >
                  <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-700 font-medium">{insight}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 学习路径推荐 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BookOpen className="h-6 w-6 text-blue-500" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900">
              推荐学习路径
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Target className="h-4 w-4 text-red-500 mr-2" />
                优先学习 (薄弱环节)
              </h4>
              {progress
                .filter((p) => p.mastery_level < 0.5)
                .map((progressItem) => {
                  const node = nodes.find((n) => n.id === progressItem.node_id);
                  return node ? (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {node.name}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {node.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">掌握度</div>
                          <div className="text-sm font-bold text-red-600">
                            {Math.round(progressItem.mastery_level * 100)}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null;
                })}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Star className="h-4 w-4 text-green-500 mr-2" />
                巩固提升 (优势领域)
              </h4>
              {progress
                .filter((p) => p.mastery_level > 0.7)
                .map((progressItem) => {
                  const node = nodes.find((n) => n.id === progressItem.node_id);
                  return node ? (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {node.name}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {node.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">掌握度</div>
                          <div className="text-sm font-bold text-green-600">
                            {Math.round(progressItem.mastery_level * 100)}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null;
                })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
