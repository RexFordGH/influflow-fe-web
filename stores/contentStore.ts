/**
 * 内容状态管理 Store
 * 使用 Zustand 管理思维导图和 Markdown 编辑器的状态同步
 */

import type { MindmapNode } from '@/lib/markdown/parser';
import { nodesToMarkdown } from '@/lib/markdown/parser';
import { Edge, Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

// 节点与 Markdown 的映射关系
export interface NodeMapping {
  nodeId: string;
  markdownSection: {
    startLine: number;
    endLine: number;
    content: string;
  };
}

// 内容状态接口
interface ContentState {
  // Markdown 相关
  markdown: string;
  markdownNodes: MindmapNode[];

  // React Flow 相关
  flowNodes: Node[];
  flowEdges: Edge[];

  // 映射关系
  mappings: NodeMapping[];

  // 当前选中的节点
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // 操作方法
  setMarkdown: (markdown: string) => void;
  setMarkdownNodes: (nodes: MindmapNode[]) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setMappings: (mappings: NodeMapping[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;

  // 同步方法
  syncMarkdownToFlow: () => void;
  syncFlowToMarkdown: () => void;
  updateNodeContent: (nodeId: string, newContent: string) => void;
  addChildNode: (parentNodeId: string) => void;
}

/**
 * 创建内容状态管理 Store
 *
 * 关键设计理念：
 * 1. 单一数据源：Markdown 内容为主数据源
 * 2. 双向同步：支持从任一侧修改都能同步到另一侧
 * 3. 映射维护：维护节点ID与Markdown段落的对应关系
 */
export const useContentStore = create<ContentState>((set, get) => ({
  // 初始状态
  markdown: '',
  markdownNodes: [],
  flowNodes: [],
  flowEdges: [],
  mappings: [],
  selectedNodeId: null,
  hoveredNodeId: null,

  // 基础设置方法
  setMarkdown: (markdown) => set({ markdown }),
  setMarkdownNodes: (markdownNodes) => set({ markdownNodes }),
  setFlowNodes: (flowNodes) => set({ flowNodes }),
  setFlowEdges: (flowEdges) => set({ flowEdges }),
  setMappings: (mappings) => set({ mappings }),
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  setHoveredNode: (hoveredNodeId) => set({ hoveredNodeId }),

  /**
   * 从 Markdown 同步到 React Flow
   * 这是主要的同步方向，因为 Markdown 是数据源
   */
  syncMarkdownToFlow: () => {
    const { markdownNodes } = get();

    console.log('同步 Markdown 到 Flow:', markdownNodes.length, '个节点');
    console.log(
      'Markdown 层级结构:',
      markdownNodes.map((n) => ({
        level: n.level,
        title: n.title,
        children: n.children.length,
      })),
    );

    if (markdownNodes.length === 0) {
      set({ flowNodes: [], flowEdges: [], mappings: [] });
      return;
    }

    const { nodes, edges, mappings } =
      convertMarkdownNodesToFlow(markdownNodes);

    console.log(
      '生成的 Flow 节点:',
      nodes.map((n) => ({
        id: n.id,
        level: n.data.level,
        title: n.data.label,
      })),
    );
    console.log('生成的 Flow 边:', edges.length, '个');
    console.log(
      '边连接关系:',
      edges.map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);
        return `${sourceNode?.data.label} -> ${targetNode?.data.label}`;
      }),
    );

    set({
      flowNodes: nodes,
      flowEdges: edges,
      mappings,
    });
  },

  /**
   * 从 React Flow 同步到 Markdown
   * 用于处理用户在思维导图中的编辑操作
   */
  syncFlowToMarkdown: () => {
    const { flowNodes, flowEdges, mappings } = get();

    if (flowNodes.length === 0) {
      set({ markdown: '', markdownNodes: [] });
      return;
    }

    // 将React Flow节点转换回层级结构
    const hierarchicalNodes = convertFlowNodesToHierarchy(
      flowNodes,
      flowEdges,
      mappings,
    );

    // 转换为Markdown文本
    const markdown = convertNodesToMarkdown(hierarchicalNodes);

    set({
      markdown,
      markdownNodes: hierarchicalNodes,
    });
  },

  /**
   * 更新单个节点的内容
   */
  updateNodeContent: (nodeId: string, newContent: string) => {
    const { flowNodes, setFlowNodes, syncFlowToMarkdown } = get();

    const updatedNodes = flowNodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            label: newContent,
          },
        };
      }
      return node;
    });

    setFlowNodes(updatedNodes);
    syncFlowToMarkdown();
  },

  /**
   * 添加子节点
   */
  addChildNode: (parentNodeId: string) => {
    const {
      flowNodes,
      flowEdges,
      setFlowNodes,
      setFlowEdges,
      syncFlowToMarkdown,
    } = get();

    // 找到父节点
    const parentNode = flowNodes.find((node) => node.id === parentNodeId);
    if (!parentNode) return;

    // 生成新节点ID
    const newNodeId = uuidv4();

    // 计算新节点的层级（父节点层级 + 1）
    const newLevel = (parentNode.data?.level || 1) + 1;

    // 智能计算新节点位置，避免与现有子节点重叠
    const parentPosition = parentNode.position;

    // 找到当前父节点的所有子节点
    const parentChildEdges = flowEdges.filter(
      (edge) => edge.source === parentNodeId,
    );
    const childNodeIds = parentChildEdges.map((edge) => edge.target);
    const childNodes = flowNodes.filter((node) =>
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

    // 创建新节点
    const newNode: Node = {
      id: newNodeId,
      type: 'mindmapNode',
      position: newPosition,
      data: {
        label: '新节点',
        level: newLevel,
      },
      style: {
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
      },
    };

    // 创建新边
    const newEdge: Edge = {
      id: `edge-${parentNodeId}-${newNodeId}`,
      source: parentNodeId,
      target: newNodeId,
      type: 'simplebezier',
      style: {
        stroke: '#6B7280',
        strokeWidth: 3,
      },
    };

    // 更新状态
    setFlowNodes([...flowNodes, newNode]);
    setFlowEdges([...flowEdges, newEdge]);

    // 不立即同步到 Markdown，等用户编辑完成后再同步
  },
}));

/**
 * 将 Markdown 节点转换为 React Flow 节点和边
 * @param markdownNodes - Markdown 解析出的节点
 * @returns 包含 nodes, edges, mappings 的对象
 */
const convertMarkdownNodesToFlow = (markdownNodes: MindmapNode[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const mappings: NodeMapping[] = [];

  /**
   * 计算子树高度的函数 - 修复版本
   * 确保每个子树分配足够的垂直空间，避免重叠
   */
  const calculateSubtreeHeight = (node: MindmapNode): number => {
    if (node.children.length === 0) {
      return 120; // 叶子节点基础高度（增加了间距）
    }

    // 递归计算所有子节点的总高度，包含间距
    const childrenTotalHeight = node.children.reduce((total, child) => {
      return total + calculateSubtreeHeight(child);
    }, 0);

    // 加上子节点间的间距：(子节点数-1) * 间距
    const childrenSpacing = (node.children.length - 1) * 30;

    return Math.max(120, childrenTotalHeight + childrenSpacing);
  };

  /**
   * 改进的递归处理节点，确保不同子树不重叠
   */
  const processNode = (
    node: MindmapNode,
    parentId: string | null,
    x: number,
    y: number,
  ): number => {
    // 使用UUID生成唯一ID，确保每个节点都有全局唯一标识
    const nodeId = uuidv4();

    // 创建 React Flow 节点
    const flowNode: Node = {
      id: nodeId,
      type: 'mindmapNode',
      position: { x, y },
      data: {
        label: node.title,
        level: node.level,
        content: node.content,
        originalNode: node,
      },
      style: {
        background: getNodeColor(node.level),
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '120px',
        fontSize: '14px',
      },
    };

    nodes.push(flowNode);

    // 创建映射关系
    const mapping: NodeMapping = {
      nodeId,
      markdownSection: {
        startLine: node.position?.line || 0,
        endLine: node.position?.line || 0,
        content: node.title,
      },
    };
    mappings.push(mapping);

    // 创建与父节点的连接
    if (parentId) {
      const edge: Edge = {
        id: uuidv4(), // 使用UUID确保边ID的唯一性
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#666' },
      };
      edges.push(edge);
    }

    // 如果没有子节点，返回单个节点的高度
    if (node.children.length === 0) {
      return 100;
    }

    // 处理子节点，为每个子节点分配独立的垂直空间
    const childX = x + 350; // 增加水平间距，避免重叠

    // 计算所有子节点所需的总空间
    const childSubtreeHeights = node.children.map((child) =>
      calculateSubtreeHeight(child),
    );
    const totalChildrenHeight = childSubtreeHeights.reduce(
      (sum, h) => sum + h,
      0,
    );
    const totalSpacing = (node.children.length - 1) * 30;
    const totalRequiredHeight = totalChildrenHeight + totalSpacing;

    // 计算起始Y位置，使所有子节点在当前节点位置居中
    const startY = y - totalRequiredHeight / 2;

    let currentChildY = startY;
    const childCenterYs: number[] = [];

    // 为每个子节点分配确定的空间
    node.children.forEach((child, index) => {
      const childSubtreeHeight = childSubtreeHeights[index];
      const childCenterY = currentChildY + childSubtreeHeight / 2;

      // 递归处理子节点
      processNode(child, nodeId, childX, childCenterY);

      childCenterYs.push(childCenterY);
      currentChildY += childSubtreeHeight + 30; // 固定间距
    });

    // 当前节点位置保持在Y位置（已经是子节点的中心）
    flowNode.position.y = y;

    return totalRequiredHeight;
  };

  // 处理根节点 - 确保根节点之间有足够间距
  let currentRootY = 150;
  markdownNodes.forEach((node) => {
    const subtreeHeight = calculateSubtreeHeight(node);

    // 将根节点定位在其子树的中心
    processNode(node, null, 50, currentRootY);

    // 为下一个根节点预留空间
    currentRootY += subtreeHeight + 150; // 根节点间更大间距
  });

  return { nodes, edges, mappings };
};

/**
 * 根据标题层级返回对应的颜色
 * @param level - 标题层级 (1-6)
 * @returns 颜色值
 */
const getNodeColor = (level: number): string => {
  const colors = {
    1: '#FF6B6B', // 红色 - H1
    2: '#4ECDC4', // 青色 - H2
    3: '#45B7D1', // 蓝色 - H3
    4: '#96CEB4', // 绿色 - H4
    5: '#FFEAA7', // 黄色 - H5
    6: '#DDA0DD', // 紫色 - H6
  };

  return colors[level as keyof typeof colors] || '#E0E0E0';
};

/**
 * 将React Flow节点转换回层级结构
 * @param flowNodes - React Flow节点数组
 * @param flowEdges - React Flow边数组
 * @param mappings - 节点映射关系
 * @returns MindmapNode[] 层级结构的节点数组
 */
const convertFlowNodesToHierarchy = (
  flowNodes: Node[],
  flowEdges: Edge[],
  _mappings: NodeMapping[],
): MindmapNode[] => {
  if (flowNodes.length === 0) return [];

  // 创建节点映射表
  const nodeMap = new Map<string, MindmapNode>();

  // 转换所有节点
  flowNodes.forEach((node, index) => {
    const mindmapNode: MindmapNode = {
      id: node.id,
      level: node.data?.level || 1,
      title: node.data?.label || `节点 ${index + 1}`,
      content: node.data?.content || '',
      children: [],
      position: {
        line: index + 1,
        column: 1,
      },
    };

    nodeMap.set(node.id, mindmapNode);
  });

  // 使用边信息构建父子关系
  const parentChildMap = new Map<string, string[]>();
  const childParentMap = new Map<string, string>();

  // 构建父子关系映射
  flowEdges.forEach((edge) => {
    const parentId = edge.source;
    const childId = edge.target;

    // 记录父子关系
    if (!parentChildMap.has(parentId)) {
      parentChildMap.set(parentId, []);
    }
    parentChildMap.get(parentId)!.push(childId);
    childParentMap.set(childId, parentId);
  });

  // 递归构建层级结构
  const buildHierarchy = (nodeId: string): MindmapNode | null => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    // 获取子节点ID列表
    const childIds = parentChildMap.get(nodeId) || [];

    // 递归处理子节点
    node.children = childIds
      .map((childId) => buildHierarchy(childId))
      .filter((child): child is MindmapNode => child !== null);

    return node;
  };

  // 找到根节点（没有父节点的节点）
  const rootNodeIds = flowNodes
    .map((node) => node.id)
    .filter((nodeId) => !childParentMap.has(nodeId));

  // 构建根节点及其子树
  const rootNodes = rootNodeIds
    .map((rootId) => buildHierarchy(rootId))
    .filter((node): node is MindmapNode => node !== null);

  return rootNodes;
};

/**
 * 将层级节点转换为Markdown文本
 * @param nodes - 层级结构的节点数组
 * @returns string Markdown文本
 */
const convertNodesToMarkdown = (nodes: MindmapNode[]): string => {
  return nodesToMarkdown(nodes);
};

/**
 * Store 使用示例和最佳实践
 *
 * 基本用法：
 * ```typescript
 * const {
 *   markdown,
 *   setMarkdown,
 *   syncMarkdownToFlow
 * } = useContentStore()
 *
 * // 更新 Markdown 内容
 * setMarkdown(newMarkdown)
 *
 * // 同步到思维导图
 * syncMarkdownToFlow()
 * ```
 *
 * 高级用法 - 节点选中联动：
 * ```typescript
 * const {
 *   selectedNodeId,
 *   setSelectedNode,
 *   mappings
 * } = useContentStore()
 *
 * // 选中节点时高亮对应的 Markdown 区域
 * const handleNodeClick = (nodeId: string) => {
 *   setSelectedNode(nodeId)
 *   const mapping = mappings.find(m => m.nodeId === nodeId)
 *   if (mapping) {
 *     // 高亮 Markdown 编辑器中的对应行
 *     highlightMarkdownLines(mapping.markdownSection)
 *   }
 * }
 * ```
 */
