/**
 * React Flow 思维导图主组件
 * 整合自定义节点、布局算法和交互逻辑
 */

'use client';

import { Button } from '@heroui/react';
import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { useContentStore } from '@/stores/contentStore';

import MindmapNode from './MindmapNode';

// 导入 React Flow 样式
import 'reactflow/dist/style.css';

/**
 * 思维导图流程图组件
 *
 * 核心功能：
 * 1. 展示从 Markdown 解析的思维导图结构
 * 2. 支持节点拖拽、缩放、选中等交互
 * 3. 实现与 Markdown 编辑器的实时联动
 * 4. 提供自动布局和手动编辑能力
 */
const MindmapFlow = () => {
  const {
    flowNodes,
    flowEdges,
    selectedNodeId,
    setSelectedNode,
    syncMarkdownToFlow,
    setFlowNodes,
    setFlowEdges,
    syncFlowToMarkdown,
  } = useContentStore();

  // React Flow 状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 监听节点变化，处理非删除操作
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      // 应用React Flow的原生变化
      onNodesChange(changes);

      // 对于非删除操作，也要同步到store（比如位置变化、选中状态等）
      const hasNonDeleteChanges = changes.some(
        (change) => change.type !== 'remove',
      );

      if (hasNonDeleteChanges) {
        // 延迟同步非删除变化
        setTimeout(() => {
          // 这里可以处理位置更新等其他变化
          // 暂时不需要特殊处理，因为删除操作由专门的函数处理
        }, 10);
      }
    },
    [onNodesChange],
  );

  // 监听边变化，处理删除操作
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      // 先应用React Flow的原生变化
      onEdgesChange(changes);

      // 检查是否有边被删除
      const hasEdgeDeletion = changes.some(
        (change) => change.type === 'remove',
      );

      if (hasEdgeDeletion) {
        // 延迟同步，确保React Flow状态已更新
        setTimeout(() => {
          const currentEdges = changes.reduce((acc, change) => {
            if (change.type === 'remove') {
              return acc.filter((edge: any) => edge.id !== change.id);
            }
            return acc;
          }, edges);

          // 更新store中的边数据
          setFlowEdges(currentEdges);

          // 同步到Markdown
          syncFlowToMarkdown();
        }, 50);
      }
    },
    [onEdgesChange, edges, setFlowEdges, syncFlowToMarkdown],
  );

  // 处理节点删除操作 - 专门的删除处理函数
  const handleNodesDelete = useCallback(
    (nodesToDelete: any[]) => {
      const deletedNodeIds = nodesToDelete.map((node) => node.id);

      // 找到所有需要删除的节点（包括子节点）
      const getDescendantNodeIds = (
        nodeId: string,
        allEdges: any[],
      ): string[] => {
        const childIds = allEdges
          .filter((edge) => edge.source === nodeId)
          .map((edge) => edge.target);

        const descendants: string[] = [...childIds];
        childIds.forEach((childId) => {
          descendants.push(...getDescendantNodeIds(childId, allEdges));
        });

        return descendants;
      };

      // 收集所有要删除的节点ID（包括子节点）
      const allNodesToDelete = new Set(deletedNodeIds);
      deletedNodeIds.forEach((nodeId) => {
        const descendants = getDescendantNodeIds(nodeId, edges);
        descendants.forEach((id) => allNodesToDelete.add(id));
      });

      console.log(
        '删除节点:',
        deletedNodeIds,
        '级联删除:',
        Array.from(allNodesToDelete),
      );

      // 过滤掉被删除的节点
      const currentNodes = nodes.filter(
        (node) => !allNodesToDelete.has(node.id),
      );
      const currentEdges = edges.filter(
        (edge) =>
          !allNodesToDelete.has(edge.source) &&
          !allNodesToDelete.has(edge.target),
      );

      // 更新本地状态
      setNodes(currentNodes);
      setEdges(currentEdges);

      // 更新store中的数据
      setFlowNodes(currentNodes);
      setFlowEdges(currentEdges);

      // 同步到Markdown
      syncFlowToMarkdown();
    },
    [
      nodes,
      edges,
      setNodes,
      setEdges,
      setFlowNodes,
      setFlowEdges,
      syncFlowToMarkdown,
    ],
  );

  const { fitView } = useReactFlow();

  // 节点颜色映射
  const getNodeColor = useCallback((level: number) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
    ];
    return colors[level - 1] || '#E0E0E0';
  }, []);

  // 同步 store 中的数据到本地状态，并为节点添加样式覆盖
  useEffect(() => {
    const nodesWithStyle = flowNodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
      },
    }));
    setNodes(nodesWithStyle);
  }, [flowNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges]);

  // 动态更新边的颜色
  useEffect(() => {
    if (edges.length > 0 && nodes.length > 0) {
      const updatedEdges = edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        if (sourceNode && sourceNode.data?.level) {
          const color = getNodeColor(sourceNode.data.level);
          return {
            ...edge,
            type: 'simplebezier',
            style: {
              ...edge.style,
              stroke: color,
              strokeWidth: 3,
            },
          };
        }
        return {
          ...edge,
          type: 'simplebezier',
          style: {
            ...edge.style,
            stroke: '#6B7280',
            strokeWidth: 3,
          },
        };
      });

      // 只有当边的样式发生变化时才更新
      const hasChanges = updatedEdges.some(
        (edge, index) => edge.style?.stroke !== edges[index]?.style?.stroke,
      );

      if (hasChanges) {
        setEdges(updatedEdges);
      }
    }
  }, [nodes, edges, getNodeColor, setEdges]);

  // 自定义节点类型映射
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      mindmapNode: MindmapNode,
    }),
    [],
  );

  /**
   * 处理连接创建
   * 当用户手动创建节点间的连接时触发
   */
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  /**
   * 处理节点选择事件
   * 同步选中状态到全局 store
   */
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const selectedNode = selectedNodes[0];
      setSelectedNode(selectedNode?.id || null);
    },
    [setSelectedNode],
  );

  /**
   * 自动布局功能
   * 基于子树空间预留的布局算法
   */
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // 构建父子关系映射
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string>();

    edges.forEach((edge) => {
      const parentId = edge.source;
      const childId = edge.target;

      if (!parentChildMap.has(parentId)) {
        parentChildMap.set(parentId, []);
      }
      parentChildMap.get(parentId)!.push(childId);
      childParentMap.set(childId, parentId);
    });

    // 找到根节点
    const rootNodes = nodes.filter((node) => !childParentMap.has(node.id));
    const layoutNodes = [...nodes];

    /**
     * 计算子树所需高度 - 修复版本
     * 确保每个子树分配足够的垂直空间
     */
    const calculateSubtreeHeight = (nodeId: string): number => {
      const childIds = parentChildMap.get(nodeId) || [];

      if (childIds.length === 0) {
        return 120; // 叶子节点基础高度
      }

      // 递归计算所有子节点的总高度
      const childrenTotalHeight = childIds.reduce((total, childId) => {
        return total + calculateSubtreeHeight(childId);
      }, 0);

      // 加上子节点间的间距
      const childrenSpacing = (childIds.length - 1) * 30;

      return Math.max(120, childrenTotalHeight + childrenSpacing);
    };

    /**
     * 递归布局函数 - 确保子树不重叠
     */
    const layoutNodeTree = (nodeId: string, x: number, y: number): number => {
      const node = layoutNodes.find((n) => n.id === nodeId);
      if (!node) return y + 100;

      // 获取子节点
      const childIds = parentChildMap.get(nodeId) || [];

      if (childIds.length === 0) {
        // 叶子节点，直接设置位置
        node.position = { x, y };
        return 100;
      }

      // 为每个子节点计算并分配独立空间
      const childX = x + 350; // 增加水平间距

      // 计算所有子节点所需的总空间
      const childSubtreeHeights = childIds.map((childId) =>
        calculateSubtreeHeight(childId),
      );
      const totalChildrenHeight = childSubtreeHeights.reduce(
        (sum, h) => sum + h,
        0,
      );
      const totalSpacing = (childIds.length - 1) * 30;
      const totalRequiredHeight = totalChildrenHeight + totalSpacing;

      // 计算起始Y位置，使所有子节点在当前节点位置居中
      const startY = y - totalRequiredHeight / 2;

      let currentChildY = startY;

      // 为每个子节点分配确定的空间
      childIds.forEach((childId, index) => {
        const childSubtreeHeight = childSubtreeHeights[index];
        const childCenterY = currentChildY + childSubtreeHeight / 2;

        // 递归布局子节点
        layoutNodeTree(childId, childX, childCenterY);

        currentChildY += childSubtreeHeight + 30; // 固定间距
      });

      // 当前节点位置保持在Y位置（已经是子节点的中心）
      node.position = { x, y };

      return totalRequiredHeight;
    };

    // 布局根节点 - 确保根节点之间有足够间距
    let currentRootY = 150;
    rootNodes.forEach((rootNode) => {
      const subtreeHeight = calculateSubtreeHeight(rootNode.id);

      // 将根节点定位在其子树的中心
      layoutNodeTree(rootNode.id, 50, currentRootY);

      // 为下一个根节点预留空间
      currentRootY += subtreeHeight + 150; // 根节点间更大间距
    });

    // console.log('布局完成，节点位置:', layoutNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
    setNodes(layoutNodes);

    // 延迟执行适应视图
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
  }, [nodes, edges, setNodes, fitView]);

  /**
   * 重置视图到适合大小
   */
  const handleFitView = useCallback(() => {
    fitView({ duration: 500 });
  }, [fitView]);

  /**
   * 刷新思维导图
   * 从 Markdown 重新生成思维导图
   */
  const handleRefresh = useCallback(() => {
    syncMarkdownToFlow();
  }, [syncMarkdownToFlow]);

  // 当有新节点时自动应用布局 - 暂时禁用以排查层级问题
  useEffect(() => {
    if (flowNodes.length > 0) {
      // 暂时禁用自动布局，避免干扰层级结构
      console.log(
        'FlowNodes updated:',
        flowNodes.length,
        '个节点，暂不自动布局',
      );
      // setTimeout(() => {
      //   handleAutoLayout()
      // }, 300)
    }
  }, [flowNodes.length]); // 移除handleAutoLayout依赖，避免循环渲染

  return (
    <div className="relative size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
        // 样式配置
        defaultEdgeOptions={{
          type: 'simplebezier',
          style: {
            stroke: '#6B7280',
            strokeWidth: 3,
          },
        }}
        // 选中样式
        nodesDraggable
        nodesConnectable
        elementsSelectable
        onNodesDelete={handleNodesDelete}
      >
        {/* 控制面板 */}
        <Controls
          showZoom
          showFitView
          showInteractive
          className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        />

        {/* 小地图 */}
        <MiniMap
          nodeColor={(node) => {
            const level = node.data?.level || 1;
            const colors = [
              '#FF6B6B',
              '#4ECDC4',
              '#45B7D1',
              '#96CEB4',
              '#FFEAA7',
              '#DDA0DD',
            ];
            return colors[level - 1] || '#E0E0E0';
          }}
          className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        />

        {/* 网格背景 */}
        <Background gap={20} size={1} className="opacity-30" />

        {/* 工具栏 */}
        <Panel position="top-right" className="flex flex-wrap gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={handleAutoLayout}
          >
            层级布局
          </Button>

          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onPress={handleFitView}
          >
            适应视图
          </Button>

          <Button
            size="sm"
            color="success"
            variant="flat"
            onPress={handleRefresh}
          >
            刷新
          </Button>
        </Panel>

        {/* 状态信息面板 */}
        <Panel position="bottom-left" className="text-sm text-gray-500">
          <div className="rounded border bg-white p-2 dark:bg-gray-800">
            节点数: {nodes.length} | 连接数: {edges.length} | Store节点:{' '}
            {flowNodes.length}
            {selectedNodeId && (
              <span className="ml-2 text-blue-500">
                已选中: {selectedNodeId}
              </span>
            )}
            <br />
            {nodes.length > 0 && (
              <span className="text-xs">
                首节点位置: ({nodes[0]?.position.x}, {nodes[0]?.position.y})
              </span>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

/**
 * 思维导图容器组件
 * 提供 React Flow 必需的上下文包装
 */
const MindmapFlowWrapper = () => {
  return (
    <div className="size-full">
      <MindmapFlow />
    </div>
  );
};

export default MindmapFlowWrapper;
