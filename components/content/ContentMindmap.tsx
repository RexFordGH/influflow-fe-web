'use client';

import { Button } from '@heroui/react';
import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { MindmapEdgeData, MindmapNodeData } from '@/types/content';

// 导入 React Flow 样式
import 'reactflow/dist/style.css';

// 简化的节点组件
const ContentMindmapNode = ({
  data,
  selected,
}: {
  data: any;
  selected: boolean;
}) => {
  const { label, level, highlighted } = data;

  // 根据层级确定样式
  const getNodeStyle = () => {
    const baseStyle =
      'px-3 py-2 rounded-lg font-medium transition-all duration-200';
    const levelColors = {
      1: 'bg-black text-white text-lg',
      2: 'bg-gray-300 text-black text-base',
      3: 'bg-gray-300 text-black text-sm',
      4: 'bg-gray-300 text-black text-sm',
      5: 'bg-gray-300 text-black text-xs',
      6: 'bg-gray-300 text-black text-xs',
    };

    const levelStyle =
      levelColors[level as keyof typeof levelColors] || levelColors[6];
    const selectedStyle = selected ? 'ring-2 ring-yellow-400' : '';
    const highlightStyle = highlighted ? 'animate-pulse' : '';

    return `${baseStyle} ${levelStyle} ${selectedStyle} ${highlightStyle}`;
  };

  return <div className={getNodeStyle()}>{label}</div>;
};

interface ContentMindmapProps {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
  onNodeSelect?: (nodeId: string | null) => void;
  highlightedNodeId?: string | null;
}

export function ContentMindmap({
  nodes: mindmapNodes,
  edges: mindmapEdges,
  onNodeSelect,
  highlightedNodeId,
}: ContentMindmapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // 转换数据格式为 React Flow 格式
  const convertToFlowData = useCallback(() => {
    const flowNodes: Node[] = mindmapNodes.map((node) => ({
      id: node.id,
      type: 'contentMindmapNode',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.label,
        level: node.level,
        highlighted: highlightedNodeId === node.id,
        ...node.data,
      },
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
      },
    }));

    const flowEdges: Edge[] = mindmapEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'smoothstep',
      style: {
        stroke: '#6B7280',
        strokeWidth: 1,
      },
    }));

    return { flowNodes, flowEdges };
  }, [mindmapNodes, mindmapEdges, highlightedNodeId]);

  // 自动布局算法
  const autoLayout = useCallback(() => {
    if (mindmapNodes.length === 0) return;

    const { flowNodes } = convertToFlowData();

    // 简单的层级布局
    const nodesByLevel: { [level: number]: Node[] } = {};
    flowNodes.forEach((node) => {
      const level = node.data.level;
      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      nodesByLevel[level].push(node);
    });

    const levelWidth = 250;
    const nodeHeight = 80;
    let currentX = 50;

    Object.keys(nodesByLevel)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((level) => {
        const levelNodes = nodesByLevel[parseInt(level)];
        let currentY = 50;

        levelNodes.forEach((node) => {
          node.position = { x: currentX, y: currentY };
          currentY += nodeHeight + 30;
        });

        currentX += levelWidth;
      });

    setNodes(flowNodes);

    // 适应视图
    setTimeout(() => {
      fitView({ duration: 500 });
    }, 100);
  }, [mindmapNodes, convertToFlowData, fitView, setNodes]);

  // 更新节点和边
  useEffect(() => {
    autoLayout();
  }, [autoLayout]);

  // 更新边
  useEffect(() => {
    const { flowEdges } = convertToFlowData();
    setEdges(flowEdges);
  }, [convertToFlowData, setEdges]);

  // 节点类型定义
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      contentMindmapNode: ContentMindmapNode,
    }),
    [],
  );

  // 处理节点选择
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const selectedNode = selectedNodes[0];
      onNodeSelect?.(selectedNode?.id || null);
    },
    [onNodeSelect],
  );

  return (
    <div className="relative size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="rounded-lg border border-gray-200 bg-white"
        />

        <MiniMap
          nodeColor={(node) => {
            const level = node.data?.level || 1;
            const colors = [
              '#EF4444',
              '#3B82F6',
              '#10B981',
              '#8B5CF6',
              '#F59E0B',
              '#6B7280',
            ];
            return colors[level - 1] || colors[5];
          }}
          className="rounded-lg border border-gray-200 bg-white"
        />

        <Background gap={20} size={1} className="opacity-30" />

        <Panel position="top-right" className="flex gap-2">
          <Button size="sm" color="primary" variant="flat" onPress={autoLayout}>
            重新布局
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// 包装组件，提供 ReactFlow 上下文
export default function ContentMindmapWrapper(props: ContentMindmapProps) {
  return <ContentMindmap {...props} />;
}
