'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@heroui/react';
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
  const { label, level, onEdit, addChildNode } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // 根据层级确定样式
  const getNodeStyle = () => {
    const baseStyle =
      'min-w-[120px] max-w-[250px] min-h-[37px] px-[12px] py-[8px] rounded-[12px] transition-all duration-200 cursor-pointer relative group text-[12px] font-[500]';

    const levelColors = {
      1: 'bg-[#000000] text-white text-center min-w-[180px]',
      2: 'bg-[#E3E3E3] text-black',
      3: 'bg-[#E3E3E3] text-black',
      4: 'bg-[#E3E3E3] text-black',
      5: 'bg-[#E3E3E3] text-black',
      6: 'bg-[#E3E3E3] text-black',
    };

    const levelStyle =
      levelColors[level as keyof typeof levelColors] || levelColors[6];
    const selectedStyle = selected
      ? 'ring-2 ring-yellow-400 ring-offset-2'
      : '';

    return `${baseStyle} ${levelStyle} ${selectedStyle}`;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
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
        !inputRef.current.contains(event.target as Node)
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
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

      <div className={getNodeStyle()}>
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
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
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
  onNodesChange?: (nodes: MindmapNodeData[]) => void;
  onEdgesChange?: (edges: MindmapEdgeData[]) => void;
  highlightedNodeId?: string | null;
}

export function EditableContentMindmap({
  nodes: mindmapNodes,
  edges: mindmapEdges,
  onNodeSelect,
  onNodesChange,
  onEdgesChange,
  highlightedNodeId,
}: EditableContentMindmapProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // 转换数据格式为 React Flow 格式
  const convertToFlowData = useCallback(() => {
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
  ]);

  // 自动布局算法
  const autoLayout = useCallback(() => {
    if (mindmapNodes.length === 0) return;

    const { flowNodes } = convertToFlowData();

    // 构建父子关系
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string>();

    mindmapEdges.forEach((edge) => {
      const parentId = edge.source;
      const childId = edge.target;

      if (!parentChildMap.has(parentId)) {
        parentChildMap.set(parentId, []);
      }
      parentChildMap.get(parentId)!.push(childId);
      childParentMap.set(childId, parentId);
    });

    // 找到根节点
    const rootNodes = flowNodes.filter((node) => !childParentMap.has(node.id));

    // 计算子树高度
    const calculateSubtreeHeight = (nodeId: string): number => {
      const childIds = parentChildMap.get(nodeId) || [];

      if (childIds.length === 0) {
        return 80; // 叶子节点高度
      }

      const childrenTotalHeight = childIds.reduce((total, childId) => {
        return total + calculateSubtreeHeight(childId);
      }, 0);

      return Math.max(80, childrenTotalHeight + (childIds.length - 1) * 20);
    };

    // 递归布局
    const layoutNodeTree = (nodeId: string, x: number, y: number): number => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) return y + 80;

      const childIds = parentChildMap.get(nodeId) || [];

      if (childIds.length === 0) {
        node.position = { x, y };
        return 80;
      }

      const childX = x + 250;
      const childSubtreeHeights = childIds.map((childId) =>
        calculateSubtreeHeight(childId),
      );
      const totalChildrenHeight = childSubtreeHeights.reduce(
        (sum, h) => sum + h,
        0,
      );
      const totalSpacing = (childIds.length - 1) * 20;
      const totalRequiredHeight = totalChildrenHeight + totalSpacing;

      const startY = y - totalRequiredHeight / 2;
      let currentChildY = startY;

      childIds.forEach((childId, index) => {
        const childSubtreeHeight = childSubtreeHeights[index];
        const childCenterY = currentChildY + childSubtreeHeight / 2;

        layoutNodeTree(childId, childX, childCenterY);
        currentChildY += childSubtreeHeight + 20;
      });

      node.position = { x, y };
      return totalRequiredHeight;
    };

    // 布局所有根节点
    let currentRootY = 100;
    rootNodes.forEach((rootNode) => {
      const subtreeHeight = calculateSubtreeHeight(rootNode.id);
      layoutNodeTree(rootNode.id, 50, currentRootY);
      currentRootY += subtreeHeight + 100;
    });

    setNodes(flowNodes);

    setTimeout(() => {
      fitView({ duration: 500 });
    }, 100);
  }, [mindmapNodes, mindmapEdges, convertToFlowData, fitView, setNodes]);

  // 添加子节点
  const addChildNode = useCallback(
    (parentId: string) => {
      const newNodeId = `node-${Date.now()}`;
      const parentNode = mindmapNodes.find((n) => n.id === parentId);

      if (!parentNode) return;

      // 智能计算新节点位置，避免与现有子节点重叠
      const parentPosition = parentNode.position || { x: 50, y: 100 };
      
      // 找到当前父节点的所有子节点
      const parentChildEdges = mindmapEdges.filter(edge => edge.source === parentId);
      const childNodeIds = parentChildEdges.map(edge => edge.target);
      const childNodes = mindmapNodes.filter(node => childNodeIds.includes(node.id));
      
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
          .map(node => node.position?.y || 0)
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
        type: 'point',
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

  // 更新节点和边
  useEffect(() => {
    const { flowNodes, flowEdges } = convertToFlowData();
    // 更新节点和边数据
    setNodes(flowNodes);
    setEdges(flowEdges);

    // 如果有节点但没有运行过布局，自动运行布局
    const hasNodesAtOrigin = flowNodes.some(
      (node) => 
        node.position.x === 0 && 
        node.position.y === 0
    );
    
    if (flowNodes.length > 0 && hasNodesAtOrigin) {
      setTimeout(() => {
        autoLayout();
      }, 100);
    }
  }, [convertToFlowData, setNodes, setEdges, autoLayout]);

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

        {/* <Panel position="top-right" className="flex flex-col gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={autoLayout}
          >
            自动布局
          </Button>
          
          <Button
            size="sm"
            color="success"
            variant="flat"
            startContent={<PlusIcon className="h-4 w-4" />}
            onPress={() => {
              // 添加到根节点的子节点
              const rootNode = mindmapNodes.find(n => n.level === 1);
              if (rootNode) {
                addChildNode(rootNode.id);
              }
            }}
          >
            添加节点
          </Button>
        </Panel> */}

        {/* 悬浮工具栏 - 选中节点时显示 */}
        {highlightedNodeId && (
          <Panel position="top-center" className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<PlusIcon className="size-4" />}
              onPress={() => addChildNode(highlightedNodeId)}
            >
              添加子节点
            </Button>
          </Panel>
        )}

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
    </div>
  );
}

// 包装组件，提供 ReactFlow 上下文
export default function EditableContentMindmapWrapper(
  props: EditableContentMindmapProps,
) {
  return <EditableContentMindmap {...props} />;
}
