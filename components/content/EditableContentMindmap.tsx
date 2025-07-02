'use client';

import { PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Edge,
  Node,
  NodeTypes,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { convertMindmapToMarkdown, convertThreadDataToMindmap } from '@/lib/data/converters';
import { MindmapEdgeData, MindmapNodeData } from '@/types/content';
import { useModifyOutline, useModifyTweet, getErrorMessage } from '@/lib/api/services';
import type { Outline } from '@/types/outline';

import EditableMindmapNode from './EditableMindmapNode';

interface EditableContentMindmapProps {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
  originalOutline?: Outline; // 添加原始outline数据用于API调用
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodesChange?: (nodes: MindmapNodeData[]) => void;
  onEdgesChange?: (edges: MindmapEdgeData[]) => void;
  onRegenerate?: (markdown?: string) => void;
  highlightedNodeId?: string | null;
  hoveredTweetId?: string | null;
}

export function EditableContentMindmap({
  nodes: mindmapNodes,
  edges: mindmapEdges,
  originalOutline,
  onNodeSelect,
  onNodeHover,
  onNodesChange,
  onEdgesChange,
  onRegenerate,
  highlightedNodeId,
  hoveredTweetId,
}: EditableContentMindmapProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const { fitView } = useReactFlow();
  
  // API hooks
  const modifyOutlineMutation = useModifyOutline();
  const modifyTweetMutation = useModifyTweet();

  // 存储当前的outline数据，用于API调用
  const [currentOutline, setCurrentOutline] = useState<Outline | null>(originalOutline || null);

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
        onSelect: (nodeId: string) => {
          console.log('Manual node selection triggered:', nodeId);
          setSelectedNodeForAI(nodeId);
          onNodeSelect?.(nodeId);
        },
        onDirectSelect: setSelectedNodeForAI,
        onNodeHover: onNodeHover, // 传递hover回调
        hoveredTweetId: hoveredTweetId, // 传递hover状态
        selectedNodeForAI: selectedNodeForAI, // 传递选中状态
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
        stroke: '#000000',
        strokeWidth: 1,
      },
    }));

    return { flowNodes, flowEdges };
  }, [
    mindmapNodes,
    mindmapEdges,
    highlightedNodeId,
    selectedNodeForAI, // 添加这个依赖
    onNodesChange,
    onEdgesChange,
    onNodeHover,
  ]);

  // 参考官方ELK.js示例的布局函数
  const elk = useMemo(() => new ELK(), []);

  const getLayoutedElements = useCallback(
    async (nodes: any, edges: any, options: any = {}) => {
      const isHorizontal = options.direction === 'RIGHT';

      const graph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
          'elk.spacing.nodeNode': '30',
          'elk.layered.spacing.nodeNodeBetweenLayers': '60',
          'elk.spacing.edgeNode': '20',
          'elk.spacing.edgeEdge': '10',
          'elk.padding': '[left=50,top=50,right=50,bottom=50]',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        },
        children: nodes
          .sort((a: any, b: any) => {
            // 按level排序，再按数据顺序排序
            if (a.data?.level !== b.data?.level) {
              return (a.data?.level || 0) - (b.data?.level || 0);
            }
            // 同level内按原始顺序
            if (
              a.data?.outlineIndex !== undefined &&
              b.data?.outlineIndex !== undefined
            ) {
              return a.data.outlineIndex - b.data.outlineIndex;
            }
            if (
              a.data?.tweetId !== undefined &&
              b.data?.tweetId !== undefined
            ) {
              return a.data.tweetId - b.data.tweetId;
            }
            return 0;
          })
          .map((node: any, index: number) => {
            // 根据节点级别调整大小
            const level = node.data?.level || 1;
            let nodeWidth = 150;
            let nodeHeight = 50;

            if (level === 1) {
              nodeWidth = 180;
              nodeHeight = 60;
            } else if (level === 2) {
              nodeWidth = 160;
              nodeHeight = 55;
            }

            return {
              ...node,
              // Adjust the target and source handle positions based on the layout
              // direction.
              targetPosition: isHorizontal ? 'left' : 'top',
              sourcePosition: isHorizontal ? 'right' : 'bottom',

              // Hardcode a width and height for elk to use when layouting.
              width: nodeWidth,
              height: nodeHeight,

              // 添加ELK排序属性
              layoutOptions: {
                'elk.priority': level === 1 ? 100 : level === 2 ? 50 : 10,
                'elk.layered.priority': index,
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
        padding: 0.2, // 增加边距确保完全可见
        includeHiddenNodes: true,
        minZoom: 0.1,
        maxZoom: 2,
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
          content: '新节点',
          title: '新节点',
          groupIndex: rootOutlineIndex,
          tweetIndex: newTweetIndex,
          level: newLevel, // 记录层级信息
          parentId: parentId, // 记录父节点ID
        };
      }

      const newNode: MindmapNodeData = {
        id: newNodeId,
        label: '新节点',
        level: newLevel,
        type: newType,
        data: newNodeData,
      };

      const newEdge: MindmapEdgeData = {
        id: `edge-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
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
              padding: 0.2,
              includeHiddenNodes: true,
              minZoom: 0.1,
              maxZoom: 2,
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

  // 处理连接创建
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge: MindmapEdgeData = {
          id: `edge-${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          type: 'smoothstep',
        };
        onEdgesChange?.([...mindmapEdges, newEdge]);
      }
    },
    [mindmapEdges, onEdgesChange],
  );

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
      editableMindmapNode: EditableMindmapNode,
    }),
    [],
  );

  // 处理节点选择 - 暂时禁用
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      console.log('Selection changed (disabled):', selectedNodes);
      // 不要清除我们手动设置的状态
    },
    [],
  );

  // 处理双击编辑 (使用useModifyOutline)
  const handleNodeEdit = async (nodeId: string, newLabel: string) => {
    try {
      // 检查是否有当前outline数据
      if (!currentOutline) {
        console.error('缺少原始outline数据，无法进行编辑');
        alert('缺少原始数据，无法进行编辑');
        return;
      }

      // 找到要编辑的节点
      const targetNode = mindmapNodes.find(node => node.id === nodeId);
      if (!targetNode) {
        console.error('未找到目标节点:', nodeId);
        return;
      }

      // 深拷贝当前outline作为新的outline结构
      const newOutlineStructure: Outline = JSON.parse(JSON.stringify(currentOutline));

      // 根据节点类型和数据结构更新outline
      if (targetNode.level === 1) {
        // 主题节点
        newOutlineStructure.topic = newLabel;
      } else if (targetNode.type === 'outline_point' && targetNode.data?.outlineIndex !== undefined) {
        // 大纲点节点
        const outlineIndex = targetNode.data.outlineIndex;
        if (newOutlineStructure.nodes[outlineIndex]) {
          newOutlineStructure.nodes[outlineIndex].title = newLabel;
        }
      } else if (targetNode.type === 'tweet' && targetNode.data?.tweetId !== undefined) {
        // Tweet节点
        const tweetId = targetNode.data.tweetId;
        // 找到包含该tweet的大纲点
        for (const outlineNode of newOutlineStructure.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(tweet => tweet.tweet_number === tweetId);
          if (tweetToUpdate) {
            tweetToUpdate.title = newLabel;
            tweetToUpdate.content = newLabel; // 同时更新内容
            break;
          }
        }
      }

      // 调用 useModifyOutline API
      const result = await modifyOutlineMutation.mutateAsync({
        original_outline: currentOutline,
        new_outline_structure: newOutlineStructure
      });

      // API返回全新的完整数据，需要完整更新
      if (result.status === 'success' && result.updated_outline) {
        console.log('双击编辑成功，返回的数据:', result);
        
        const newOutline = result.updated_outline;
        
        // 更新当前存储的outline数据
        setCurrentOutline(newOutline);
        
        // 使用正确的转换函数重新构建思维导图
        const { nodes: newNodes, edges: newEdges } = convertThreadDataToMindmap({
          outline: newOutline,
          status: result.status,
          error: null
        });

        onNodesChange?.(newNodes);
        onEdgesChange?.(newEdges);
        
        // 触发整体数据源更新，使用转换后的markdown
        const newMarkdown = convertMindmapToMarkdown(newNodes, newEdges);
        onRegenerate?.(newMarkdown);
      }
    } catch (error) {
      console.error('节点编辑失败:', error);
      alert(`编辑失败: ${getErrorMessage(error)}`);
    }
  };

  // 处理AI编辑指令提交 (Edit with AI 按钮)
  const handleAIEditSubmit = async () => {
    if (!selectedNodeForAI || !aiEditInstruction.trim()) return;

    setIsAIProcessing(true);

    try {
      // 检查是否有当前outline数据
      if (!currentOutline) {
        console.error('缺少原始outline数据，无法进行AI编辑');
        alert('缺少原始数据，无法进行AI编辑');
        setIsAIProcessing(false);
        return;
      }

      // 找到要编辑的节点，获取对应的tweet_number
      const targetNode = mindmapNodes.find(node => node.id === selectedNodeForAI);
      if (!targetNode || !targetNode.data?.tweetId) {
        console.error('未找到目标节点或缺少tweetId:', selectedNodeForAI);
        alert('无法确定要编辑的内容');
        setIsAIProcessing(false);
        return;
      }

      const tweetNumber = targetNode.data.tweetId;

      // 调用 useModifyTweet API，使用真实的outline数据
      const result = await modifyTweetMutation.mutateAsync({
        outline: currentOutline,
        tweet_number: tweetNumber,
        modification_prompt: aiEditInstruction
      });

      // API只返回更新的tweet内容，需要局部更新
      if (result.updated_tweet_content && result.tweet_number) {
        console.log('AI编辑成功，返回的数据:', result);
        
        // 1. 更新currentOutline中对应的tweet内容
        const updatedOutline = JSON.parse(JSON.stringify(currentOutline)) as Outline;
        let tweetFound = false;
        
        for (const outlineNode of updatedOutline.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(tweet => tweet.tweet_number === result.tweet_number);
          if (tweetToUpdate) {
            tweetToUpdate.content = result.updated_tweet_content;
            // 如果需要，也可以更新title（通常content更改时title也要对应更新）
            tweetToUpdate.title = result.updated_tweet_content.split('\n')[0] || result.updated_tweet_content;
            tweetFound = true;
            break;
          }
        }
        
        if (!tweetFound) {
          console.error('未找到对应的tweet_number:', result.tweet_number);
          alert('更新失败：未找到对应的内容');
          return;
        }
        
        // 2. 更新currentOutline状态
        setCurrentOutline(updatedOutline);
        
        // 3. 局部更新思维导图节点数据（不重新渲染整个图）
        const updatedNodes = mindmapNodes.map(node => {
          if (node.data?.tweetId === result.tweet_number) {
            return {
              ...node,
              label: result.updated_tweet_content.split('\n')[0] || result.updated_tweet_content,
              data: {
                ...node.data,
                content: result.updated_tweet_content,
                title: result.updated_tweet_content.split('\n')[0] || result.updated_tweet_content
              }
            };
          }
          return node;
        });
        
        onNodesChange?.(updatedNodes);
        
        // 4. 重新生成markdown（使用更新后的数据）
        const newMarkdown = convertMindmapToMarkdown(updatedNodes, mindmapEdges);
        onRegenerate?.(newMarkdown);
      }

    } catch (error) {
      console.error('AI编辑失败:', error);
      alert(`编辑失败: ${getErrorMessage(error)}`);
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
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        multiSelectionKeyCode={null}
        panOnDrag={true}
        deleteKeyCode={null}
        onPaneClick={() => setSelectedNodeForAI(null)} // 点击空白区域取消选择
        defaultEdgeOptions={{
          type: 'default',
          style: { strokeWidth: 1, stroke: '#6B7280' },
          animated: false,
        }}
      >
        {/* <Controls
          showZoom
          showFitView
          showInteractive={true}
          className="bg-white border border-gray-200 rounded-lg"
        /> */}

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

        {/* Edit with AI 按钮 - 选中节点时显示 */}
        {selectedNodeForAI && (
          <Panel position="top-center" className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              variant="solid"
              startContent={<PencilIcon className="size-4" />}
              onPress={() => setShowAIEditModal(true)}
              className="rounded-full bg-[#4285F4] px-6 py-2 font-medium text-white shadow-lg hover:bg-[#3367D6]"
            >
              Edit with AI
            </Button>
          </Panel>
        )}

        {/* Regenerate 按钮 - 底部中心 */}
        <Panel position="bottom-center" className="mb-[24px]">
          <Button
            size="md"
            color="primary"
            variant="solid"
            onPress={() => {
              console.log('Regenerating markdown from mindmap');

              // 从当前思维导图数据生成新的markdown
              const newMarkdown = convertMindmapToMarkdown(
                mindmapNodes,
                mindmapEdges,
              );
              console.log('Generated markdown:', newMarkdown);

              // 调用父组件的回调，传递新生成的markdown
              onRegenerate?.(newMarkdown);
            }}
            className="rounded-full bg-[#4285F4] p-[16px] font-medium text-white shadow-[0px_0px_12px_0px_#448AFF80] hover:scale-110 hover:bg-[#3367D6]"
          >
            Regenerate
          </Button>
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

        <Panel position="bottom-left" className="flex flex-col gap-2">
          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onPress={autoLayout}
            className=" rounded-full p-[16px] font-medium text-white hover:scale-110"
          >
            Auto Layout
          </Button>
        </Panel>
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
                maxLength={300}
                className="h-[120px] w-full resize-none rounded-2xl border shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] border-gray-200 p-4 pr-12 text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
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
                  className="bg-[#4285F4] text-white px-6 hover:bg-[#3367D6]"
                >
                  {isAIProcessing ? 'Generating...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 包装组件，提供 ReactFlow 上下文
export default function EditableContentMindmapWrapper(
  props: EditableContentMindmapProps,
) {
  return <EditableContentMindmap {...props} />;
}
