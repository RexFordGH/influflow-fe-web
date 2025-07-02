'use client';

import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button, Input, Textarea } from '@heroui/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Edge,
  Handle,
  Node,
  NodeTypes,
  Panel,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { MindmapEdgeData, MindmapNodeData } from '@/types/content';

import 'reactflow/dist/style.css';

const EditableMindmapNode = ({
  data,
  id,
  selected,
}: {
  data: any;
  id: string;
  selected: boolean;
}) => {
  const { label, level, onEdit, addChildNode, onNodeHover, hoveredTweetId } =
    data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // 根据层级确定样式
  const getNodeStyle = () => {
    const baseStyle =
      'min-w-[120px] max-w-[250px] min-h-[37px] px-[12px] py-[8px] rounded-[12px] transition-all duration-200 cursor-pointer relative group text-[12px] font-[500]';

    const levelColors = {
      1: 'bg-[#000000] text-white text-center min-w-[180px] hover:bg-[rgba(0,0,0,0.6)]',
      2: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      3: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      4: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      5: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      6: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
    };

    const levelStyle =
      levelColors[level as keyof typeof levelColors] || levelColors[6];
    const selectedStyle = selected
      ? 'ring-2 ring-yellow-400 ring-offset-2'
      : '';

    // 检查是否应该高亮（基于hoveredTweetId）
    const isTweetHovered =
      hoveredTweetId &&
      data.tweetId &&
      data.tweetId.toString() === hoveredTweetId;
    const isGroupHovered =
      hoveredTweetId &&
      hoveredTweetId.startsWith('group-') &&
      data.outlineIndex !== undefined &&
      data.outlineIndex.toString() === hoveredTweetId.replace('group-', '');
    const isHovered = isTweetHovered || isGroupHovered;
    const hoverStyle = isHovered
      ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-100'
      : '';

    return `${baseStyle} ${levelStyle} ${selectedStyle} ${hoverStyle}`;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleNodeClick = (_e: React.MouseEvent) => {
    console.log('Node click handler triggered for:', id);
    // 直接设置状态，不依赖复杂的回调
    if (data.onDirectSelect) {
      data.onDirectSelect(id);
    }
  };

  const handleSave = useCallback(() => {
    if (editValue.trim()) {
      onEdit?.(id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, onEdit, id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(label);
      setIsEditing(false);
    }
  };

  // 移除了新节点自动编辑逻辑，简化交互

  // 处理点击外部区域自动保存
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        inputRef.current &&
        !inputRef.current.contains(event.target as HTMLElement)
      ) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing, handleSave]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Hover 状态管理
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // 触发上级hover回调
    if (onNodeHover) {
      if (data.tweetId) {
        // 三级节点：传递tweetId
        console.log('EditableMindmapNode hover tweet:', data.tweetId);
        onNodeHover(data.tweetId.toString());
      } else if (data.outlineIndex !== undefined) {
        // 二级节点：传递groupIndex
        console.log('EditableMindmapNode hover group:', data.outlineIndex);
        onNodeHover(`group-${data.outlineIndex}`);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // 清除hover状态
    if (onNodeHover) {
      onNodeHover(null);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff',
          left: '0',
          opacity: 0,
        }}
      />

      <div
        className={getNodeStyle()}
        style={{
          // 添加调试边框以便看到点击区域
          border: selected ? '2px solid blue' : '1px solid rgba(0,0,0,0.1)',
          pointerEvents: 'auto', // 确保可点击
        }}
      >
        {/* 删除按钮已移除 - 只保留键盘 Delete 功能 */}

        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            size="sm"
            variant="flat"
            className="min-w-[100px]"
            classNames={{
              input: 'text-center bg-white/20 text-current',
              inputWrapper: 'bg-white/20',
            }}
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} title="双击编辑">
            {label}
          </div>
        )}
      </div>

      {/* 添加子节点按钮 - hover 时显示 */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addChildNode(id);
          }}
          className="absolute -right-[20px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-[#7EABFF] hover:opacity-80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
          title="添加子节点"
        >
          <PlusIcon className="w-3 h-3" />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#000000',
          width: '8px',
          height: '8px',
          border: '2px solid #fff',
          right: '0',
          opacity: 0,
        }}
      />
    </div>
  );
};

interface EditableContentMindmapProps {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodesChange?: (nodes: MindmapNodeData[]) => void;
  onEdgesChange?: (edges: MindmapEdgeData[]) => void;
  onRegenerate?: () => void;
  highlightedNodeId?: string | null;
  hoveredTweetId?: string | null;
}

export function EditableContentMindmap({
  nodes: mindmapNodes,
  edges: mindmapEdges,
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
        onEdit: (nodeId: string, newLabel: string) => {
          const updatedNodes = mindmapNodes.map((n) =>
            n.id === nodeId ? { ...n, label: newLabel } : n,
          );
          onNodesChange?.(updatedNodes);
        },
        onDelete: (nodeId: string) => {
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
          const filteredNodes = mindmapNodes.filter(
            (n) => !toDelete.includes(n.id),
          );
          const filteredEdges = mindmapEdges.filter(
            (e) => !toDelete.includes(e.source) && !toDelete.includes(e.target),
          );

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
          if (!layoutedNodes.length || !isHorizontal) {
            // If not horizontal or no nodes, return original layout
            return {
              nodes:
                layoutedNodes.map((node: any) => ({
                  ...node,
                  position: { x: node.x, y: node.y },
                })) || [],
              edges: layoutedGraph.edges || [],
            };
          }

          // Post-processing for vertical alignment in horizontal layout
          const layers = new Map<number, any[]>();
          layoutedNodes.forEach((node) => {
            const x = Math.round(node.x!); // Round x to group nodes in the same layer
            if (!layers.has(x)) {
              layers.set(x, []);
            }
            layers.get(x)!.push(node);
          });

          let maxLayerHeight = 0;
          const layerHeights = new Map<number, number>();

          for (const [, layerNodes] of layers.entries()) {
            if (layerNodes.length === 0) continue;
            layerNodes.sort((a, b) => a.y! - b.y!);
            const firstNode = layerNodes[0];
            const lastNode = layerNodes[layerNodes.length - 1];
            const height = lastNode.y! + lastNode.height! - firstNode.y!;
            layerHeights.set(layerNodes[0].x!, height);
            if (height > maxLayerHeight) {
              maxLayerHeight = height;
            }
          }

          const finalNodes: any[] = [];
          for (const [, layerNodes] of layers.entries()) {
            if (layerNodes.length === 0) continue;
            const currentLayerHeight = layerHeights.get(layerNodes[0].x!)!;
            const offsetY = (maxLayerHeight - currentLayerHeight) / 2;

            for (const node of layerNodes) {
              finalNodes.push({
                ...node,
                position: { x: node.x, y: node.y! + offsetY },
              });
            }
          }

          return {
            nodes: finalNodes,
            edges: layoutedGraph.edges || [],
          };
        })
        .catch(() => ({ nodes, edges }));
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

  // 添加子节点
  const addChildNode = useCallback(
    (parentId: string) => {
      const newNodeId = `node-${Date.now()}`;
      const parentNode = mindmapNodes.find((n) => n.id === parentId);

      if (!parentNode) return;

      // 智能计算新节点位置，避免与现有子节点重叠
      const parentPosition = parentNode.position || { x: 50, y: 100 };

      // 找到当前父节点的所有子节点
      const parentChildEdges = mindmapEdges.filter(
        (edge) => edge.source === parentId,
      );
      const childNodeIds = parentChildEdges.map((edge) => edge.target);
      const childNodes = mindmapNodes.filter((node) =>
        childNodeIds.includes(node.id),
      );

      let newPosition;

      if (childNodes.length === 0) {
        // 如果没有子节点，放在父节点右侧
        newPosition = {
          x: parentPosition.x + 250,
          y: parentPosition.y,
        };
      } else {
        // 如果有子节点，找到合适的Y位置避免重叠
        const childPositions = childNodes
          .map((node) => node.position?.y || 0)
          .sort((a, b) => a - b);

        // 节点高度约为 60px，间距为 30px
        const nodeHeight = 60;
        const nodeSpacing = 30;

        // 策略1：尝试在现有子节点下方放置新节点
        const maxY = Math.max(...childPositions);
        newPosition = {
          x: parentPosition.x + 250,
          y: maxY + nodeHeight + nodeSpacing,
        };

        // 策略2：如果子节点太分散，尝试找到空隙插入
        if (childPositions.length > 1) {
          for (let i = 0; i < childPositions.length - 1; i++) {
            const gap = childPositions[i + 1] - childPositions[i];
            if (gap > nodeHeight + nodeSpacing * 2) {
              // 找到足够大的空隙，在其中放置新节点
              newPosition = {
                x: parentPosition.x + 250,
                y: childPositions[i] + nodeHeight + nodeSpacing,
              };
              break;
            }
          }
        }
      }

      const newNode: MindmapNodeData = {
        id: newNodeId,
        label: '新节点',
        level: parentNode.level + 1,
        type: parentNode.level >= 2 ? 'tweet' : 'outline_point',
        position: newPosition,
      };

      const newEdge: MindmapEdgeData = {
        id: `edge-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
      };

      onNodesChange?.([...mindmapNodes, newNode]);
      onEdgesChange?.([...mindmapEdges, newEdge]);
    },
    [mindmapNodes, mindmapEdges, onNodesChange, onEdgesChange],
  );

  // 添加一个ref来跟踪是否已经进行过布局
  const hasLayoutedRef = useRef(false);

  // // 添加初始化自动fitView
  // useEffect(() => {
  //   // 延迟800ms后自动调用fitView，确保初始渲染完成
  //   const timer = setTimeout(() => {
  //     console.log('初始化自动调用fitView');
  //     fitView({
  //       duration: 800,
  //       padding: 0.2,
  //       includeHiddenNodes: true,
  //       minZoom: 0.1,
  //       maxZoom: 2,
  //     });
  //   }, 1500);

  //   return () => clearTimeout(timer);
  // }, []);

  // 更新节点和边（仅在核心数据变化时）
  useEffect(() => {
    const { flowNodes, flowEdges } = convertToFlowDataStable();

    // 检查是否是首次加载且需要应用自动布局
    const shouldApplyLayout = flowNodes.length > 0 && !hasLayoutedRef.current;

    if (shouldApplyLayout) {
      console.log('首次加载，直接应用ELK布局，避免闪烁');
      hasLayoutedRef.current = true;

      // 直接应用ELK布局，不先设置原始节点
      const applyInitialLayout = async () => {
        try {
          const result = await getLayoutedElements(flowNodes, flowEdges, {
            direction: 'RIGHT',
          });

          if (result) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = result;
            console.log('首次ELK布局完成，设置节点:', layoutedNodes.length);
            
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);

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
          console.error('首次ELK布局失败:', error);
          // 失败时使用原始节点
          setNodes(flowNodes);
          setEdges(flowEdges);
        }
      };

      applyInitialLayout();
    } else {
      // 非首次加载，正常设置节点
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [
    mindmapNodes,
    mindmapEdges,
    convertToFlowDataStable,
    getLayoutedElements,
    fitView,
    setNodes,
    setEdges,
  ]);

  // 单独处理hover状态更新（不触发布局）
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
  }, [hoveredTweetId]);

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

  // 处理AI编辑指令提交
  const handleAIEditSubmit = async () => {
    if (!selectedNodeForAI || !aiEditInstruction.trim()) return;

    setIsAIProcessing(true);

    // 模拟AI处理延迟
    setTimeout(() => {
      // 找到要编辑的节点
      const targetNode = mindmapNodes.find((n) => n.id === selectedNodeForAI);
      if (targetNode) {
        // 模拟AI增强内容 - 根据用户指令生成新内容
        const enhancedContent = generateAIEnhancedContent(
          targetNode.label,
          aiEditInstruction,
        );

        // 更新节点内容
        const updatedNodes = mindmapNodes.map((node) =>
          node.id === selectedNodeForAI
            ? { ...node, label: enhancedContent }
            : node,
        );

        onNodesChange?.(updatedNodes);
      }

      setIsAIProcessing(false);
      setShowAIEditModal(false);
      setAiEditInstruction('');
    }, 2000); // 2秒模拟处理时间
  };

  // 模拟AI内容增强功能
  const generateAIEnhancedContent = (
    originalContent: string,
    instruction: string,
  ): string => {
    // 简单的模拟逻辑，根据指令关键词生成不同的增强内容
    const lowerInstruction = instruction.toLowerCase();

    if (
      lowerInstruction.includes('详细') ||
      lowerInstruction.includes('详') ||
      lowerInstruction.includes('detail')
    ) {
      return `${originalContent}（已详细化）`;
    } else if (
      lowerInstruction.includes('简化') ||
      lowerInstruction.includes('简') ||
      lowerInstruction.includes('simple')
    ) {
      return `${originalContent}（已简化）`;
    } else if (
      lowerInstruction.includes('专业') ||
      lowerInstruction.includes('专') ||
      lowerInstruction.includes('professional')
    ) {
      return `${originalContent}（专业版）`;
    } else if (
      lowerInstruction.includes('通俗') ||
      lowerInstruction.includes('易懂') ||
      lowerInstruction.includes('easy')
    ) {
      return `${originalContent}（通俗版）`;
    } else {
      return `${originalContent}（AI增强版）`;
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
        deleteKeyCode={['Delete', 'Backspace']}
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
              className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-medium px-6 py-2 rounded-full shadow-lg"
            >
              Edit with AI
            </Button>
          </Panel>
        )}

        {/* Regenerate 按钮 - 底部中心 */}
        <Panel position="bottom-center" className="mb-4">
          <Button
            size="md"
            color="primary"
            variant="solid"
            onPress={() => {
              console.log('Regenerating markdown from mindmap');
              onRegenerate?.();
            }}
            className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-medium px-8 py-3 rounded-xl shadow-lg"
          >
            Regenerate
          </Button>
        </Panel>

        {/* 调试面板 */}
        <Panel
          position="bottom-right"
          className="text-xs bg-white p-2 rounded shadow space-y-1"
        >
          <div>选中节点: {selectedNodeForAI || '无'}</div>
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
        </Panel>

        <Panel position="top-right" className="flex flex-col gap-2">
          <Button size="sm" color="primary" variant="flat" onPress={autoLayout}>
            ELK自动布局
          </Button>

          <Button
            size="sm"
            color="success"
            variant="flat"
            startContent={<PlusIcon className="h-4 w-4" />}
            onPress={() => {
              // 添加到根节点的子节点
              const rootNode = mindmapNodes.find((n) => n.level === 1);
              if (rootNode) {
                addChildNode(rootNode.id);
              }
            }}
          >
            添加节点
          </Button>
        </Panel>

        {/* <Panel position="bottom-left" className="text-sm text-gray-500">
          <div className="bg-white p-2 rounded border border-gray-200">
            节点: {nodes.length} | 连接: {edges.length}
            <br />
            <span className="text-xs">
              双击节点编辑 | 拖拽调整位置 | Delete删除
            </span>
          </div>
        </Panel> */}
      </ReactFlow>

      {/* AI编辑对话框 - 固定在底部 */}
      {showAIEditModal && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold">
                How would you like to enhance this part?
              </h3>
            </div>
            <div className="space-y-4">
              <Textarea
                value={aiEditInstruction}
                onChange={(e) => setAiEditInstruction(e.target.value)}
                placeholder="Please limit to 300 words."
                maxLength={300}
                minRows={4}
                maxRows={8}
                variant="bordered"
                className="w-full"
                classNames={{
                  input: 'text-sm',
                  inputWrapper: 'border-gray-200 focus:border-blue-500',
                }}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="flat"
                  onPress={() => {
                    setShowAIEditModal(false);
                    setAiEditInstruction('');
                  }}
                  className="px-6"
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={handleAIEditSubmit}
                  isLoading={isAIProcessing}
                  disabled={!aiEditInstruction.trim()}
                  className="bg-[#4285F4] hover:bg-[#3367D6] px-6"
                >
                  {isAIProcessing ? '生成中...' : '提交'}
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
