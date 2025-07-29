import { useCallback, useEffect, useState } from 'react';
import { MindmapEdgeData, MindmapNodeData } from '@/types/content';

interface UseMindmapInteractionProps {
  currentNodes: MindmapNodeData[];
  currentEdges: MindmapEdgeData[];
  onNodesUpdate?: (nodes: MindmapNodeData[]) => void;
  onEdgesUpdate?: (edges: MindmapEdgeData[]) => void;
}

interface UseMindmapInteractionReturn {
  // 状态
  selectedNodeId: string | null;
  hoveredTweetId: string | null;
  highlightedSection: string | null;
  scrollToSection: string | null;
  
  // 方法
  handleNodeSelect: (nodeId: string | null) => void;
  handleNodeHover: (tweetId: string | null) => void;
  handleMarkdownHover: (tweetId: string | null) => void;
  handleNodesChange: (newNodes: MindmapNodeData[]) => void;
  handleEdgesChange: (newEdges: MindmapEdgeData[]) => void;
  
  // 节点操作
  updateNodes: (nodes: MindmapNodeData[]) => void;
  updateEdges: (edges: MindmapEdgeData[]) => void;
}

export function useMindmapInteraction({
  currentNodes,
  currentEdges,
  onNodesUpdate,
  onEdgesUpdate
}: UseMindmapInteractionProps): UseMindmapInteractionReturn {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredTweetId, setHoveredTweetId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  
  // 清除滚动状态，防止重复滚动
  useEffect(() => {
    if (scrollToSection) {
      const timer = setTimeout(() => {
        setScrollToSection(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [scrollToSection]);
  
  // 处理节点选择
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    
    // 根据选中的节点高亮对应的推文
    if (nodeId && currentNodes) {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (node && node.data?.tweetId) {
        const tweetId = node.data.tweetId.toString();
        setHoveredTweetId(tweetId);
        // 设置滚动目标为tweetId
        setScrollToSection(tweetId);
      } else if (node && node.data?.groupIndex !== undefined) {
        // 如果是group节点，滚动到group
        const groupId = `group-${node.data.groupIndex}`;
        setHoveredTweetId(groupId);
        setScrollToSection(groupId);
      } else {
        setHoveredTweetId(null);
        setScrollToSection(null);
      }
    }
  }, [currentNodes]);
  
  // 处理思维导图节点的 hover 事件
  const handleNodeHover = useCallback((tweetId: string | null) => {
    console.log('handleNodeHover called with:', tweetId);
    setHoveredTweetId(tweetId);
    setHighlightedSection(tweetId);
  }, []);
  
  // 处理 markdown 区域的 hover 事件（从 markdown 到思维导图的反向联动）
  const handleMarkdownHover = useCallback((tweetId: string | null) => {
    setHoveredTweetId(tweetId);
    
    // 反向高亮思维导图节点
    if (tweetId && currentNodes) {
      const node = currentNodes.find(n => n.data?.tweetId?.toString() === tweetId);
      if (node) {
        setHighlightedSection(node.id);
      } else {
        setHighlightedSection(null);
      }
    } else {
      setHighlightedSection(null);
    }
  }, [currentNodes]);
  
  // 处理节点变化
  const handleNodesChange = useCallback((newNodes: MindmapNodeData[]) => {
    onNodesUpdate?.(newNodes);
  }, [onNodesUpdate]);
  
  // 处理边变化
  const handleEdgesChange = useCallback((newEdges: MindmapEdgeData[]) => {
    onEdgesUpdate?.(newEdges);
  }, [onEdgesUpdate]);
  
  // 更新节点
  const updateNodes = useCallback((nodes: MindmapNodeData[]) => {
    onNodesUpdate?.(nodes);
  }, [onNodesUpdate]);
  
  // 更新边
  const updateEdges = useCallback((edges: MindmapEdgeData[]) => {
    onEdgesUpdate?.(edges);
  }, [onEdgesUpdate]);
  
  return {
    // 状态
    selectedNodeId,
    hoveredTweetId,
    highlightedSection,
    scrollToSection,
    
    // 方法
    handleNodeSelect,
    handleNodeHover,
    handleMarkdownHover,
    handleNodesChange,
    handleEdgesChange,
    
    // 节点操作
    updateNodes,
    updateEdges,
  };
}