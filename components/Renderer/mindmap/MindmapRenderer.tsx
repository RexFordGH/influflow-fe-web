'use client';

import { Button, Tooltip } from '@heroui/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { useTweetThreadData } from '@/hooks/useTweetThreadData';
import { useModifyTweet } from '@/lib/api/services';
import { convertMindmapToMarkdown } from '@/lib/data/converters';
import { MindmapEdgeData, MindmapNodeData } from '@/types/content';
import type { IDraftData } from '@/types/draft';
import type { IOutline } from '@/types/outline';
import { copyTwitterContent } from '@/utils/twitter';

import MindmapNode from './MindmapNode';

interface EditableContentMindmapProps {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
  originalOutline?: IOutline; // 添加原始outline数据用于API调用
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodesChange?: (nodes: MindmapNodeData[]) => void;
  onEdgesChange?: (edges: MindmapEdgeData[]) => void;
  onRegenerate?: (markdown?: string) => void;
  onRegenerateClick?: () => Promise<void>; // 新增：调用API的重生成回调
  highlightedNodeId?: string | null;
  hoveredTweetId?: string | null;
  isRegenerating?: boolean; // 新增：regenerate loading 状态
  user?: any; // 新增：user属性
}

// 提示词历史展示组件
const DraftInfoDisplay: React.FC<{
  draft: IDraftData;
  isThinking?: boolean;
}> = ({ draft, isThinking }) => {
  const sections = [
    {
      emoji: '📝',
      title: 'Topic',
      content: draft.topic,
    },
    {
      emoji: '💬',
      title: 'Content Angel',
      content: draft.content_angle,
    },
    {
      emoji: '🔑',
      title: 'Key Points to Cover',
      content:
        draft.key_points?.map((string) => `• ${string}`).join('\n') || '',
    },
    {
      emoji: '👥',
      title: 'Target Audience',
      content: draft.target_audience,
    },
    {
      emoji: '🌐',
      title: 'Output Language',
      content: draft.output_language || 'Chinese',
    },
    {
      emoji: '🎯',
      title: 'Purpose',
      content: draft.purpose || '',
    },
    {
      emoji: '📏',
      title: 'Estimated Length',
      content: draft.content_length,
    },
    {
      emoji: '📊',
      title: 'Content Depth',
      content: draft.content_depth || '',
    },
    {
      emoji: '🔗',
      title: 'Add link to improve accuracy?',
      content:
        draft.references?.length > 0
          ? draft.references.map((ref, idx) => (
              <a
                key={idx}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-blue-600 underline"
                style={{ wordBreak: 'break-all' }}
              >
                {ref}
              </a>
            ))
          : '-',
    },
    {
      emoji: '📋',
      title: 'Special Requirements',
      content:
        draft.requirements?.length > 0
          ? draft.requirements.map((req) => `• ${req}`).join('\n')
          : '-',
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="flex gap-10">
          <div className="flex w-1/3 items-start gap-3">
            <span className="text-xl">{section.emoji}</span>
            <p
              className="whitespace-pre-line text-base text-black"
              style={{ fontFamily: 'Poppins' }}
            >
              {section.title}
            </p>
          </div>
          <div className="flex-1">
            <p
              className="whitespace-pre-line text-base text-black"
              style={{ fontFamily: 'Poppins' }}
            >
              {isThinking && index === 0 ? (
                <span className="text-gray-400">Generating...</span>
              ) : (
                section.content
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export function MindmapRenderer({
  nodes: mindmapNodes,
  edges: mindmapEdges,
  originalOutline,
  user,
  onNodeSelect,
  onNodeHover,
  onNodesChange,
  onEdgesChange,
  onRegenerate,
  onRegenerateClick,
  highlightedNodeId,
  hoveredTweetId,
  isRegenerating = false,
}: EditableContentMindmapProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // API hooks - 只保留 useModifyTweet 用于 AI 编辑
  const modifyTweetMutation = useModifyTweet();

  // 存储当前的outline数据，用于API调用
  const [currentOutline, setCurrentOutline] = useState<IOutline | null>(
    originalOutline || null,
  );

  // 同步原始outline数据的变化
  useEffect(() => {
    if (originalOutline) {
      setCurrentOutline(originalOutline);
    }
  }, [originalOutline]);

  // AI 编辑相关状态
  const [selectedNodeForAI, setSelectedNodeForAI] = useState<string | null>(
    null,
  );
  const [showAIEditModal, setShowAIEditModal] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // PromptHistoryDisplay 相关状态
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const [draftInfoDisplay, setPromptHistoryData] = useState<IDraftData | null>(
    null,
  );
  const [userInputFromSupabase, setUserInputFromSupabase] =
    useState<string>('');

  // 使用draft数据hook
  const { fetchTweetThreadFromSupabase, isLoadingTweetThread } = useTweetThreadData();

  const handleEditWithAI = useCallback((nodeId: string) => {
    setSelectedNodeForAI(nodeId);
    setShowAIEditModal(true);
  }, []);

  const NodeWithAIButton = useCallback((props: any) => {
    const { selected, data, id } = props;
    return (
      <div className="relative">
        {/* {selected && (
          <div className="absolute left-1/2 top-[-45px] z-10 -translate-x-1/2">
            <Button
              size="sm"
              onPress={() => data.onEditWithAI(id)}
              startContent={<PencilIcon className="size-3" />}
              className="shadow-[0px_0px_12px_0px_rgba(68, 138, 255, 0.5)] flex items-center rounded-full bg-[#4285F4] px-[14px] py-[8px] text-xs text-white hover:bg-[#3367D6]"
            >
              Edit with AI
            </Button>
          </div>
        )} */}
        <MindmapNode {...props} />
      </div>
    );
  }, []);

  // 转换数据格式为 React Flow 格式（稳定版本，不包含hover状态）
  const convertToFlowDataStable = useCallback(() => {
    const flowNodes: Node[] = mindmapNodes.map((node) => ({
      id: node.id,
      type: 'editableMindmapNode',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.label,
        level: node.level,
        highlighted: highlightedNodeId === node.id,
        onEdit: handleNodeEdit,
        onDelete: (nodeId: string) => {
          console.log('删除节点:', nodeId);

          // 删除节点及其所有子节点
          const getDescendants = (id: string): string[] => {
            const children = mindmapEdges
              .filter((edge) => edge.source === id)
              .map((edge) => edge.target);

            const descendants: string[] = [...children];
            children.forEach((childId) => {
              descendants.push(...getDescendants(childId));
            });

            return descendants;
          };

          const toDelete = [nodeId, ...getDescendants(nodeId)];
          console.log('要删除的节点ID列表:', toDelete);

          const filteredNodes = mindmapNodes.filter(
            (n) => !toDelete.includes(n.id),
          );
          const filteredEdges = mindmapEdges.filter(
            (e) => !toDelete.includes(e.source) && !toDelete.includes(e.target),
          );

          console.log('删除后剩余节点数:', filteredNodes.length);
          console.log('删除后剩余边数:', filteredEdges.length);

          onNodesChange?.(filteredNodes);
          onEdgesChange?.(filteredEdges);
        },
        addChildNode: (parentId: string) => {
          addChildNode(parentId);
        },
        onNodeClick: (nodeId: string) => {
          console.log('Node clicked:', nodeId);
          // 手动更新选中状态
          setSelectedNodeForAI(nodeId);
          onNodeSelect?.(nodeId);

          // 手动设置 React Flow 的选中状态
          setNodes((currentNodes) =>
            currentNodes.map((node) => ({
              ...node,
              selected: node.id === nodeId,
            })),
          );
        },
        onNodeHover: onNodeHover, // 传递hover回调
        hoveredTweetId: hoveredTweetId, // 传递hover状态
        onEditWithAI: handleEditWithAI,
        ...node.data,
      },
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
      },
      draggable: true,
      selectable: true,
    }));

    const flowEdges: Edge[] = mindmapEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: false,
      deletable: true,
      style: {
        stroke: '#374151',
        strokeWidth: 1.5,
      },
    }));

    return { flowNodes, flowEdges };
  }, [
    mindmapNodes,
    mindmapEdges,
    highlightedNodeId,
    onNodesChange,
    onEdgesChange,
    onNodeHover,
    handleEditWithAI,
  ]);

  // 参考官方ELK.js示例的布局函数
  const elk = useMemo(() => new ELK(), []);

  const getLayoutedElements = useCallback(
    async (nodes: any, edges: any, options: any = {}) => {
      const isHorizontal = options.direction === 'RIGHT';

      const graph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'mrtree',
          'elk.direction': 'RIGHT',
          // 基本间距控制 - 减少水平和垂直距离
          'elk.spacing.nodeNode': '20',
          'elk.spacing.nodeNodeBetweenLayers': '50', // 适中的层级间距
          'elk.padding': '[left=20,top=20,right=20,bottom=20]',
          // 树形算法特定设置
          'elk.mrtree.weighting': 'UNIFORM',
          'elk.mrtree.searchOrder': 'DFS',
          // 强制保持节点原始顺序
          'elk.separateConnectedComponents': 'false',
          'elk.partitioning.activate': 'false',
          'elk.mrtree.orderChildren': 'true',
        },
        children: nodes.map((node: any, index: number) => {
          const level = node.data?.level || 1;
          const text = node.data?.label || '';

          // 设置固定最大宽度（适中的宽度）
          let maxWidth;
          if (level === 1) {
            maxWidth = 160;
            // 根节点：根据文本长度调整，但保持合理范围
            // const textLength = text.length;
            // if (textLength <= 15) {
            //   maxWidth = 160;
            // } else if (textLength <= 25) {
            //   maxWidth = 220;
            // } else if (textLength <= 35) {
            //   maxWidth = 260;
            // } else {
            //   maxWidth = 300;
            // }
          } else if (level === 2) {
            maxWidth = 200;
          } else {
            maxWidth = 300;
          }

          // 动态计算高度以适应换行文本
          const chineseCharCount = (text.match(/[一-鿿]/g) || []).length;
          const otherCharCount = text.length - chineseCharCount;
          const estimatedTextWidth = chineseCharCount * 14 + otherCharCount * 8;

          const padding = 16; // 进一步减少padding
          const availableTextWidth = maxWidth - padding;
          const estimatedLines = Math.max(
            1,
            Math.ceil(estimatedTextWidth / availableTextWidth),
          );

          const lineHeight = 16; // 减少行高
          const minHeight = level === 1 ? 40 : level === 2 ? 35 : 30; // 减少最小高度

          // 如果是单行文本，使用最小高度；多行文本才增加高度
          const height =
            estimatedLines === 1
              ? minHeight
              : Math.max(minHeight, estimatedLines * lineHeight + padding);

          return {
            ...node,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            width: maxWidth,
            height,
            // 添加强制布局选项保持原始顺序
            layoutOptions: {
              'elk.priority': 1000 - index, // 使用倒序优先级，确保原始顺序不变
              'elk.mrtree.orderChildren': 'true', // 保持子节点顺序
              'elk.mrtree.weighting': 'UNIFORM', // 节点级别也设置UNIFORM
              'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', // 考虑模型顺序
            },
          };
        }),
        edges: edges,
      };

      return elk
        .layout(graph)
        .then((layoutedGraph) => {
          const layoutedNodes = layoutedGraph.children || [];

          // 简化：直接使用ELK的布局结果，不做复杂处理
          const resultNodes = layoutedNodes.map((node: any) => ({
            ...node,
            position: { x: node.x || 0, y: node.y || 0 },
          }));

          return {
            nodes: resultNodes,
            edges: layoutedGraph.edges || [],
          };
        })
        .catch((error) => {
          console.error('ELK布局失败:', error);
          return { nodes, edges };
        });
    },
    [elk],
  );

  // 使用ELK.js自动布局算法 - 参考官方示例
  const autoLayout = useCallback(async () => {
    if (mindmapNodes.length === 0) return;

    console.log('开始执行ELK布局，节点数量:', mindmapNodes.length);
    const { flowNodes, flowEdges } = convertToFlowDataStable();

    const result = await getLayoutedElements(flowNodes, flowEdges, {
      direction: 'RIGHT',
    });

    if (!result) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = result;

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    // 手动调用fitView确保视图适配和居中
    setTimeout(() => {
      fitView({
        duration: 600,
        padding: 0.1, // 减少边距，让内容更紧凑
        includeHiddenNodes: true,
        minZoom: 0.8, // 允许稍微缩小，避免过度拉伸
        maxZoom: 2.5, // 减少最大缩放
      });
    }, 500); // 增加延迟确保布局完成
  }, [
    mindmapNodes,
    mindmapEdges,
    convertToFlowDataStable,
    getLayoutedElements,
    setNodes,
    setEdges,
    fitView,
  ]);

  // 添加子节点 - 简化版本，完全依赖ELK布局
  const addChildNode = useCallback(
    (parentId: string) => {
      const parentNode = mindmapNodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      const newLevel = parentNode.level + 1;
      // 第2层是outline_point，第3层及以上都是tweet类型
      const newType = newLevel === 2 ? 'outline_point' : 'tweet';

      let newNodeId: string;
      let newNodeData: any = {};

      if (newType === 'outline_point') {
        // 为outline_point分配groupIndex
        const existingOutlineNodes = mindmapNodes.filter(
          (n) => n.type === 'outline_point',
        );
        const maxOutlineIndex = Math.max(
          -1,
          ...existingOutlineNodes.map((n) => n.data?.outlineIndex || -1),
        );
        const newOutlineIndex = maxOutlineIndex + 1;

        newNodeId = `group-${newOutlineIndex}`;
        newNodeData = {
          outlineIndex: newOutlineIndex,
        };
      } else {
        // 为tweet分配tweetId
        const existingTweetNodes = mindmapNodes.filter(
          (n) => n.type === 'tweet',
        );
        const maxTweetId = Math.max(
          0,
          ...existingTweetNodes.map((n) => n.data?.tweetId || 0),
        );
        const newTweetId = maxTweetId + 1;

        // 获取根outline节点的outlineIndex（追溯到level 2的祖先节点）
        let rootOutlineIndex = 0;
        let currentNode: MindmapNodeData | null = parentNode;
        while (currentNode && currentNode.level > 2) {
          const parentEdge = mindmapEdges.find(
            (edge) => edge.target === currentNode!.id,
          );
          if (parentEdge) {
            currentNode =
              mindmapNodes.find((n) => n.id === parentEdge.source) || null;
          } else {
            break;
          }
        }
        if (currentNode && currentNode.level === 2) {
          rootOutlineIndex = currentNode.data?.outlineIndex ?? 0;
        }

        // 计算在该父节点下的索引
        const siblingTweets = mindmapEdges
          .filter((edge) => edge.source === parentId)
          .map((edge) => edge.target)
          .map((id) => mindmapNodes.find((n) => n.id === id))
          .filter((n) => n?.type === 'tweet');

        const newTweetIndex = siblingTweets.length;

        // 生成唯一的节点ID，支持多层级
        newNodeId = `tweet-${rootOutlineIndex}-${newTweetId}-L${newLevel}`;
        newNodeData = {
          tweetId: newTweetId,
          content: '',
          title: 'New Node',
          groupIndex: rootOutlineIndex,
          tweetIndex: newTweetIndex,
          level: newLevel, // 记录层级信息
          parentId: parentId, // 记录父节点ID
        };
      }

      const newNode: MindmapNodeData = {
        id: newNodeId,
        label: 'New Node',
        level: newLevel,
        type: newType,
        data: newNodeData,
      };

      const newEdge: MindmapEdgeData = {
        id: `edge-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: 'default',
      };

      // 更新数据
      onNodesChange?.([...mindmapNodes, newNode]);
      onEdgesChange?.([...mindmapEdges, newEdge]);
    },
    [mindmapNodes, mindmapEdges, onNodesChange, onEdgesChange],
  );

  // 简化版本：每次数据变化都重新布局
  useEffect(() => {
    const { flowNodes, flowEdges } = convertToFlowDataStable();

    if (flowNodes.length === 0) return;

    console.log('节点数据变化，开始重新布局，节点数量:', flowNodes.length);

    // 每次都重新应用ELK布局
    const applyLayout = async () => {
      try {
        const result = await getLayoutedElements(flowNodes, flowEdges, {
          direction: 'RIGHT',
        });

        if (result) {
          const { nodes: layoutedNodes, edges: layoutedEdges } = result;
          console.log('ELK布局完成，设置节点数量:', layoutedNodes.length);

          setNodes([...layoutedNodes]);
          setEdges([...layoutedEdges]);

          // 布局完成后自动调整视图
          setTimeout(() => {
            fitView({
              duration: 600,
              padding: 0.1, // 减少边距，让内容更紧凑
              includeHiddenNodes: true,
              minZoom: 0.8, // 允许稍微缩小，避免过度拉伸
              maxZoom: 2.5, // 减少最大缩放
            });
          }, 300);
        }
      } catch (error) {
        console.error('ELK布局失败:', error);
        // 失败时使用原始节点位置
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    };

    applyLayout();
  }, [
    mindmapNodes,
    mindmapEdges,
    // 移除 convertToFlowDataStable，直接在useEffect内部调用
    // getLayoutedElements,
    // fitView,
    // setNodes,
    // setEdges,
  ]);

  // 单独处理hover状态更新，不触发重新布局
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          hoveredTweetId: hoveredTweetId,
        },
      })),
    );
  }, [hoveredTweetId, setNodes]);

  // 处理键盘删除事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 检查当前是否有输入框获得焦点
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).contentEditable === 'true');

        // 如果有输入框获得焦点，不处理删除节点
        if (isInputFocused) {
          return;
        }

        if (selectedNodeForAI) {
          // 使用我们自己的删除逻辑
          const nodeData = nodes.find((n) => n.id === selectedNodeForAI)?.data;
          if (nodeData && nodeData.onDelete) {
            event.preventDefault(); // 阻止默认行为
            nodeData.onDelete(selectedNodeForAI);
            setSelectedNodeForAI(null);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeForAI, nodes]);

  // 连接功能已移除

  // 处理边删除
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChangeInternal(changes);

      const deletedEdges = changes.filter((change) => change.type === 'remove');
      if (deletedEdges.length > 0) {
        const remainingEdges = mindmapEdges.filter(
          (edge) => !deletedEdges.some((deleted) => deleted.id === edge.id),
        );
        onEdgesChange?.(remainingEdges);
      }
    },
    [onEdgesChangeInternal, mindmapEdges, onEdgesChange],
  );

  // 节点类型定义
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      editableMindmapNode: NodeWithAIButton,
    }),
    [NodeWithAIButton],
  );

  // 处理节点选择 - 作为备选方案
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      console.log('React Flow selection changed:', selectedNodes);

      // 如果 React Flow 的原生选中仍然有效，使用它
      if (selectedNodes.length > 0) {
        const selectedNodeId = selectedNodes[0].id;
        setSelectedNodeForAI(selectedNodeId);
        onNodeSelect?.(selectedNodeId);
      } else {
        // 只有当没有手动选中时才清空
        if (selectedNodes.length === 0) {
          setSelectedNodeForAI(null);
          onNodeSelect?.(null);
        }
      }
    },
    [onNodeSelect],
  );

  // 处理双击编辑 (本地实时编辑，不发送请求)
  const handleNodeEdit = (nodeId: string, newLabel: string) => {
    // 找到要编辑的节点
    const targetNode = mindmapNodes.find((node) => node.id === nodeId);
    if (!targetNode) {
      console.error('未找到目标节点:', nodeId);
      return;
    }

    // 本地更新思维导图节点数据
    const updatedNodes = mindmapNodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          label: newLabel, // 更新节点显示的标题
          data: {
            ...node.data,
            title: newLabel, // 同步更新 data.title
          },
        };
      }
      return node;
    });

    // 本地更新 outline 数据
    if (currentOutline) {
      const updatedOutline = JSON.parse(
        JSON.stringify(currentOutline),
      ) as IOutline;

      // 根据节点类型更新对应的数据
      if (targetNode.level === 1) {
        // 主题节点
        updatedOutline.topic = newLabel;
      } else if (
        targetNode.type === 'outline_point' &&
        targetNode.data?.outlineIndex !== undefined
      ) {
        // 大纲点节点
        const outlineIndex = targetNode.data.outlineIndex;
        if (updatedOutline.nodes[outlineIndex]) {
          updatedOutline.nodes[outlineIndex].title = newLabel;
        }
      } else if (
        targetNode.type === 'tweet' &&
        targetNode.data?.tweetId !== undefined
      ) {
        // Tweet节点
        const tweetId = targetNode.data.tweetId;
        for (const outlineNode of updatedOutline.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(
            (tweet) => tweet.tweet_number === tweetId,
          );
          if (tweetToUpdate) {
            tweetToUpdate.title = newLabel;
            break;
          }
        }
      }

      // 更新本地 outline 状态
      setCurrentOutline(updatedOutline);
    }

    // 更新思维导图显示
    onNodesChange?.(updatedNodes);
  };

  // 处理AI编辑指令提交 (Edit with AI 按钮)
  const handleAIEditSubmit = async () => {
    if (!selectedNodeForAI || !aiEditInstruction.trim()) return;

    setIsAIProcessing(true);

    try {
      // 检查是否有当前outline数据
      if (!currentOutline) {
        console.error('缺少原始outline数据，无法进行AI编辑');
        setIsAIProcessing(false);
        return;
      }

      // 找到要编辑的节点，获取对应的tweet_number
      const targetNode = mindmapNodes.find(
        (node) => node.id === selectedNodeForAI,
      );
      if (!targetNode || !targetNode.data?.tweetId) {
        console.error('未找到目标节点或缺少tweetId:', selectedNodeForAI);
        setIsAIProcessing(false);
        return;
      }

      const tweetNumber = targetNode.data.tweetId;

      // 调用 useModifyTweet API，使用真实的outline数据
      const result = await modifyTweetMutation.mutateAsync({
        outline: currentOutline,
        tweet_number: tweetNumber,
        modification_prompt: aiEditInstruction,
      });

      // API只返回更新のtweet内容，需要局部更新
      if (result.updated_tweet_content) {
        console.log('AI编辑成功，返回的数据:', result);

        // 1. 更新currentOutline中对应的tweet内容
        const updatedOutline = JSON.parse(
          JSON.stringify(currentOutline),
        ) as IOutline;
        let tweetFound = false;

        for (const outlineNode of updatedOutline.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(
            (tweet) => tweet.tweet_number === tweetNumber,
          );
          if (tweetToUpdate) {
            tweetToUpdate.content = result.updated_tweet_content;
            // useModifyTweet 只更新 content，不修改 title
            tweetFound = true;
            break;
          }
        }

        if (!tweetFound) {
          console.error('未找到对应的tweet_number:', tweetNumber);
          return;
        }

        // 2. 更新currentOutline状态
        setCurrentOutline(updatedOutline);

        // 3. 局部更新思维导图节点数据（不重新渲染整个图）
        // useModifyTweet 只更新 content，思维导图节点的 label 和 title 保持不变
        const updatedNodes = mindmapNodes.map((node) => {
          if (node.data?.tweetId === tweetNumber) {
            return {
              ...node,
              // label 保持不变
              data: {
                ...node.data,
                content: result.updated_tweet_content,
                // title 保持不变
              },
            };
          }
          return node;
        });

        onNodesChange?.(updatedNodes);

        // 4. 重新生成markdown（使用更新后的数据）
        const newMarkdown = convertMindmapToMarkdown(
          updatedNodes,
          mindmapEdges,
        );
        onRegenerate?.(newMarkdown);
      }
    } catch (error) {
      console.error('AI编辑失败:', error);
    } finally {
      setIsAIProcessing(false);
      setShowAIEditModal(false);
      setAiEditInstruction('');
    }
  };

  return (
    <div className="relative size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={handleEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={true}
        multiSelectionKeyCode={null}
        selectionOnDrag={true}
        panOnDrag={true}
        deleteKeyCode={null}
        onPaneClick={() => {
          console.log('Pane clicked - clearing selection');
          setSelectedNodeForAI(null);
          onNodeSelect?.(null);

          // 手动清除所有节点的选中状态
          setNodes((currentNodes) =>
            currentNodes.map((node) => ({
              ...node,
              selected: false,
            })),
          );
        }} // 点击空白区域取消选择
        defaultEdgeOptions={{
          type: 'default',
          style: { strokeWidth: 1.5, stroke: '#374151' },
          animated: false,
        }}
      >
        <Controls
          showZoom
          showFitView
          showInteractive={true}
          className="rounded-lg border border-gray-200 bg-white"
        />

        {/* <MiniMap
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
          className="bg-white border border-gray-200 rounded-lg"
        /> */}

        <Background gap={20} size={1} className="opacity-30" />

        <Panel
          position="bottom-center"
          className="mb-[24px] flex flex-col gap-[10px]"
        >
          {/* 为按钮添 Prompt History */}
          <div className="flex items-center gap-3">
            <Tooltip
              content="Prompt History"
              showArrow={true}
              placement="top"
              color="foreground"
            >
              <Button
                size="sm"
                color="primary"
                variant="solid"
                onPress={async () => {
                  // 实时获取draft数据
                  // console.log('prompt history', originalOutline?.id);
                  // console.log('user', user?.id);

                  if (!originalOutline?.id || !user?.id) {
                    console.warn(
                      'Missing outlineId or userId for fetching draft data',
                    );
                    return;
                  }

                  // 从 Supabase 获取 draft 数据
                  const draftData = await fetchTweetThreadFromSupabase(
                    originalOutline.id
                  );

                  // 无论是否有draft数据，都打开模态框
                  setPromptHistoryData(draftData?.draft || null);
                  setUserInputFromSupabase(draftData?.user_input || '');
                  setShowPromptHistory(true);

                  if (!draftData?.draft) {
                    console.warn('No draft data available in Supabase');
                  }
                }}
                className={`flex size-10 min-w-10 items-center justify-center rounded-full p-0 transition-colors duration-200 hover:bg-[#DDE9FF]`}
              >
                <img src="/icons/vector.svg" alt="check" className="size-6" />
              </Button>
            </Tooltip>

            <Button
              size="md"
              color="primary"
              variant="solid"
              isLoading={isRegenerating}
              isDisabled={isRegenerating}
              onPress={async () => {
                // 调用父组件的 API 重生成回调
                if (onRegenerateClick) {
                  await onRegenerateClick();
                } else {
                  console.warn('没有提供 onRegenerateClick 回调');
                }
              }}
              className={`rounded-full p-[16px] font-medium text-white shadow-[0px_0px_12px_0px_#448AFF80] ${
                isRegenerating
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-[#4285F4] hover:scale-110 hover:bg-[#3367D6]'
              }`}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </div>
        </Panel>

        {/* 调试面板 */}
        {/* <Panel
          position="bottom-right"
          className="max-w-[200px] space-y-1 rounded bg-white p-2 text-xs shadow"
        >
          <div>选中节点: {selectedNodeForAI || '无'}</div>
          <div>应显示按钮: {selectedNodeForAI ? '是' : '否'}</div>
          <Button
            size="sm"
            onPress={() => {
              const firstNode = nodes[0];
              if (firstNode) {
                console.log('强制选择节点:', firstNode.id);
                setSelectedNodeForAI(firstNode.id);
              }
            }}
          >
            测试选择
          </Button>
          <Button size="sm" onPress={() => setSelectedNodeForAI(null)}>
            清除选择
          </Button>
        </Panel> */}

        {/* <Panel position="bottom-left" className="flex flex-col gap-2">
          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onPress={autoLayout}
            className=" rounded-full p-[16px] font-medium text-white hover:scale-110"
          >
            Auto Layout
          </Button>
        </Panel> */}
      </ReactFlow>

      {/* AI编辑对话框 - 固定在底部 */}
      {showAIEditModal && (
        <div className="absolute inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-[#F5F6F7] shadow-lg">
          <div className="mx-auto max-w-4xl px-[48px] py-[32px]">
            <div className="mb-[24px] text-center">
              <h3 className="text-xl font-semibold">
                How would you like to enhance this part?
              </h3>
            </div>
            <div>
              <textarea
                value={aiEditInstruction}
                onChange={(e) => setAiEditInstruction(e.target.value)}
                placeholder="Please limit to 300 words."
                maxLength={1000}
                className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                rows={4}
              />

              <div className="mt-[24px] flex justify-end gap-3">
                <Button
                  variant="flat"
                  onPress={() => {
                    setShowAIEditModal(false);
                    setAiEditInstruction('');
                  }}
                  className="px-6"
                >
                  cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAIEditSubmit}
                  isLoading={isAIProcessing}
                  disabled={!aiEditInstruction.trim()}
                  className="bg-[#4285F4] px-6 text-white hover:bg-[#3367D6]"
                >
                  {isAIProcessing ? 'Generating...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PromptHistoryDisplay 模态框 */}
      {showPromptHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`mx-4 max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl ${draftInfoDisplay ? 'max-w-4xl' : 'max-w-[555px]'}`}
          >
            <div className="px-8 pb-1 pt-[20px]">
              {/* 顶部 */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="medium text-[20px] text-gray-900">
                  Prompt History
                </h2>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setShowPromptHistory(false)}
                  className="size-9 min-w-9 rounded-full p-0"
                >
                  <span className="text-xl font-bold text-gray-400">✕</span>
                </Button>
              </div>

              {/* 内容复制框 */}
              <div className="mb-6">
                <div
                  className={`flex items-end gap-3 ${draftInfoDisplay ? '' : 'flex-row-reverse'} ${userInputFromSupabase ? 'justify-end' : 'justify-center'}`}
                >
                  {userInputFromSupabase && (
                    <Tooltip
                      content="Copy"
                      showArrow={true}
                      placement="top"
                      color="foreground"
                    >
                      <Button
                        size="sm"
                        color="primary"
                        variant="solid"
                        onPress={async () => {
                          await copyTwitterContent(userInputFromSupabase);
                        }}
                        className="size-10 min-w-10 rounded-lg p-0 hover:bg-[#EFEFEF]"
                      >
                        <img
                          src="/icons/copy.svg"
                          alt="copy"
                          className="size-5"
                        />
                      </Button>
                    </Tooltip>
                  )}

                  {userInputFromSupabase ? (
                    <div className="max-w-md rounded-lg bg-[#F8F8F8] px-3 py-2">
                      <span className="whitespace-pre-wrap break-words text-base text-gray-900">
                        {userInputFromSupabase}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base text-gray-400">
                      No user input.
                    </span>
                  )}
                </div>
              </div>

              {/* 写作意图部分 */}
              {draftInfoDisplay && (
                <div className="mb-6">
                  <h3 className="medium text-[16px] text-gray-900">
                    Final Draft
                  </h3>

                  <DraftInfoDisplay draft={draftInfoDisplay} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 包装组件，提供 ReactFlow 上下文
export default function MindmapWrapper(props: EditableContentMindmapProps) {
  return <MindmapRenderer {...props} />;
}
