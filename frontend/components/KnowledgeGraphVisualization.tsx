'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface KnowledgeNode {
  id: string;
  name: string;
  description: string;
  node_type: string;
  level: number;
  category: string;
  mastery_level?: number;
}

interface KnowledgeEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  weight: number;
}

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  userProgress?: any[];
  onNodeClick?: (node: KnowledgeNode) => void;
  height?: number;
  interactive?: boolean;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphProps> = ({
  nodes,
  edges,
  userProgress = [],
  onNodeClick,
  height = 600,
  interactive = true
}) => {
  const networkContainer = useRef<HTMLDivElement>(null);
  const network = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  
  // Create progress map for quick lookup
  const progressMap = new Map(
    userProgress.map(p => [p.node_id, p.mastery_level || 0])
  );

  useEffect(() => {
    if (!networkContainer.current || nodes.length === 0) return;

    // Prepare nodes data with visual styling
    const visNodes = new DataSet(
      nodes.map(node => {
        const masteryLevel = progressMap.get(node.id) || 0;
        const nodeColor = getNodeColor(node.category, masteryLevel);
        const nodeSize = getNodeSize(node.level);
        
        return {
          id: node.id,
          label: node.name,
          title: `${node.name}\nType: ${node.node_type}\nLevel: ${node.level}\nMastery: ${(masteryLevel * 100).toFixed(0)}%\n\n${node.description}`,
          color: nodeColor,
          size: nodeSize,
          font: {
            size: 12,
            color: '#333'
          },
          borderWidth: masteryLevel > 0.8 ? 3 : 1,
          borderWidthSelected: 4,
          chosen: {
            node: (values: any, id: string) => {
              values.borderWidth = 3;
              values.color = '#4F46E5';
            }
          }
        };
      })
    );

    // Prepare edges data with styling
    const visEdges = new DataSet(
      edges.map(edge => ({
        id: edge.id,
        from: edge.from_node_id,
        to: edge.to_node_id,
        title: `Relationship: ${edge.edge_type}\nStrength: ${(edge.weight * 100).toFixed(0)}%`,
        color: getEdgeColor(edge.edge_type),
        width: Math.max(1, edge.weight * 3),
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8
          }
        },
        smooth: {
          type: 'curvedCW',
          roundness: 0.2
        }
      }))
    );

    // Network configuration
    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 20,
          max: 50
        }
      },
      edges: {
        smooth: true,
        arrows: {
          to: true
        }
      },
      physics: {
        stabilization: { 
          iterations: 100,
          updateInterval: 25
        },
        barnesHut: {
          gravitationalConstant: -8000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        dragNodes: interactive,
        dragView: interactive,
        zoomView: interactive
      },
      layout: {
        improvedLayout: true
      }
    };

    // Create network
    const data = { nodes: visNodes, edges: visEdges };
    network.current = new Network(networkContainer.current, data as any, options);

    // Event handlers
    if (interactive) {
      network.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            onNodeClick?.(node);
          }
        }
      });

      network.current.on('hoverNode', () => {
        networkContainer.current!.style.cursor = 'pointer';
      });

      network.current.on('blurNode', () => {
        networkContainer.current!.style.cursor = 'default';
      });
    }

    // Cleanup
    return () => {
      if (network.current) {
        network.current.destroy();
        network.current = null;
      }
    };
  }, [nodes, edges, userProgress, interactive, onNodeClick]);

  const getNodeColor = (category: string, masteryLevel: number): any => {
    // Base colors by category
    const baseColors = {
      listening: '#3B82F6', // Blue
      speaking: '#EF4444',  // Red
      reading: '#10B981',   // Green
      writing: '#8B5CF6',   // Purple
      grammar: '#F59E0B',   // Amber
      vocabulary: '#EC4899', // Pink
      strategy: '#6B7280'   // Gray
    };

    const baseColor = baseColors[category as keyof typeof baseColors] || '#6B7280';
    
    // Adjust opacity based on mastery level
    const opacity = Math.max(0.3, masteryLevel);
    
    return {
      background: baseColor,
      border: baseColor,
      highlight: {
        background: baseColor,
        border: '#1F2937'
      }
    };
  };

  const getNodeSize = (level: number): number => {
    return 20 + (level * 5); // Size 25-45 based on difficulty level
  };

  const getEdgeColor = (edgeType: string): any => {
    const colors = {
      prerequisite: '#DC2626', // Red - important dependency
      related: '#3B82F6',       // Blue - related concepts
      contains: '#059669',      // Green - hierarchical
      enables: '#7C3AED'        // Purple - enables learning
    };

    return {
      color: colors[edgeType as keyof typeof colors] || '#6B7280',
      highlight: '#1F2937',
      hover: '#374151'
    };
  };

  const getLegendItems = () => [
    { color: '#3B82F6', label: 'Listening', type: 'category' },
    { color: '#EF4444', label: 'Speaking', type: 'category' },
    { color: '#10B981', label: 'Reading', type: 'category' },
    { color: '#8B5CF6', label: 'Writing', type: 'category' },
    { color: '#F59E0B', label: 'Grammar', type: 'category' },
    { color: '#EC4899', label: 'Vocabulary', type: 'category' },
    { color: '#DC2626', label: 'Prerequisite', type: 'edge' },
    { color: '#3B82F6', label: 'Related', type: 'edge' },
    { color: '#059669', label: 'Contains', type: 'edge' },
    { color: '#7C3AED', label: 'Enables', type: 'edge' }
  ];

  return (
    <div className="knowledge-graph-container">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Graph */}
        <div className="flex-1">
          <div 
            ref={networkContainer}
            style={{ height: `${height}px` }}
            className="border border-gray-200 rounded-lg bg-white shadow-sm"
          />
        </div>
        
        {/* Side Panel */}
        <div className="lg:w-80 space-y-4">
          {/* Legend */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">图例</h3>
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">知识分类</h4>
                <div className="grid grid-cols-2 gap-1">
                  {getLegendItems().filter(item => item.type === 'category').map(item => (
                    <div key={item.label} className="flex items-center text-xs">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">关系类型</h4>
                <div className="space-y-1">
                  {getLegendItems().filter(item => item.type === 'edge').map(item => (
                    <div key={item.label} className="flex items-center text-xs">
                      <div 
                        className="w-3 h-0.5 mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">节点详情</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">名称：</span>
                  <span className="text-sm text-gray-900">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">类型：</span>
                  <span className="text-sm text-gray-900">{selectedNode.node_type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">分类：</span>
                  <span className="text-sm text-gray-900">{selectedNode.category}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">难度：</span>
                  <span className="text-sm text-gray-900">{selectedNode.level}/5</span>
                </div>
                {progressMap.has(selectedNode.id) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">掌握度：</span>
                    <span className="text-sm text-gray-900">
                      {(progressMap.get(selectedNode.id)! * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <span className="text-sm font-medium text-gray-600">描述：</span>
                  <p className="text-sm text-gray-700 mt-1">{selectedNode.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Graph Statistics */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">图谱统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
                <div className="text-xs text-gray-500">知识点</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{edges.length}</div>
                <div className="text-xs text-gray-500">关系</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userProgress.filter(p => p.mastery_level > 0.8).length}
                </div>
                <div className="text-xs text-gray-500">已掌握</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userProgress.filter(p => p.mastery_level < 0.5).length}
                </div>
                <div className="text-xs text-gray-500">需加强</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphVisualization;