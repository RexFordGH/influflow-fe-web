export interface Article {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  children: Article[];
  expanded: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  title: string;
  articles: Article[];
  expanded: boolean;
  tweetData?: any; // 保存原始 tweet_thread 数据
}

// 导入API中统一的类型定义
import type { IOutline, ITweet } from '@/types/outline';

// 重新导出类型供其他模块使用
export type { IOutline as Outline, ITweet as Tweet };

// 后端返回的内容生成数据格式
export interface GeneratedContent {
  id: string;
  topic: string;
  createdAt: string;

  // 思维导图数据 - 基于Tweet数据生成
  mindmap: {
    nodes: MindmapNodeData[];
    edges: MindmapEdgeData[];
  };

  // Tweet线程数据
  tweets: SimpleTweet[];

  // 大纲数据
  outline: IOutline;

  // 图片信息
  image: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string; // AI生成图片的提示词
  };

  // 元数据
  metadata: {
    totalTweets: number;
    estimatedReadTime: number;
    sources?: string[]; // 信息来源
  };
}

// 前端使用的Tweet类型（简化版）
export interface SimpleTweet {
  id: number;
  content: string;
  order: number;
}

// 思维导图节点数据
export interface MindmapNodeData {
  id: string;
  label: string;
  level: number; // 1-6 对应 H1-H6，1为topic，2为outline points，3+为tweets
  type: 'topic' | 'outline_point' | 'tweet';
  position?: {
    x: number;
    y: number;
  };
  data?: {
    content?: string;
    highlighted?: boolean;
    title?: string; // tweet的标题
    // 关联到Tweet或outline数据
    tweetId?: number; // 关联的Tweet ID
    outlineIndex?: number; // 关联的大纲点索引
    groupIndex?: number; // 分组索引用于hover联动
    tweetIndex?: number; // tweet索引用于hover联动
    // 运行时辅助字段
    parentId?: string; // 父节点ID（在运行时添加子节点时使用）
    level?: number; // 可选：冗余层级信息（在运行时添加子节点时使用）
    isLastLeaf?: boolean; // 是否为整棵树中的最后一个叶子节点
  };
}

// 思维导图连接数据
export interface MindmapEdgeData {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'smoothstep' | 'simpleBezier';
}

// AI生成请求数据
export interface GenerateContentRequest {
  topic: string;
  type: 'ai_generate' | 'manual_write';
  options?: {
    includeImage?: boolean;
    tone?: 'professional' | 'casual' | 'academic';
    length?: 'short' | 'medium' | 'long';
  };
}

// 图片编辑相关类型
export interface ImageEditState {
  isEditing: boolean;
  originalImage: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  editingPrompt: string;
  isGenerating: boolean;
  generatedImage?: {
    url: string;
    alt: string;
    caption?: string;
    prompt: string;
  };
}

// 图片生成对话项
export interface ImageConversationItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  isApplied?: boolean;
  isLoading?: boolean;
}

export interface ImageEditProps {
  image: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  targetTweet: string;
  tweetThread: string;
  isInitialGenerating?: boolean; // 新增：是否正在初次生成图片
  onImageUpdate: (newImage: {
    url: string;
    alt: string;
    caption?: string;
    prompt: string;
  }) => void;
  onClose: () => void;
}

export interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'success' | 'error';
  message?: string;
  progress?: number;
}
