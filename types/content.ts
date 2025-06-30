// 后端返回的内容生成数据格式
export interface GeneratedContent {
  id: string;
  topic: string;
  createdAt: string;
  
  // 思维导图数据
  mindmap: {
    nodes: MindmapNodeData[];
    edges: MindmapEdgeData[];
  };
  
  // Markdown内容
  markdown: string;
  
  // 图片信息
  image: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string; // AI生成图片的提示词
  };
  
  // 元数据
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    sources?: string[]; // 信息来源
  };
}

// 思维导图节点数据
export interface MindmapNodeData {
  id: string;
  label: string;
  level: number; // 1-6 对应 H1-H6
  type: 'topic' | 'subtopic' | 'point';
  position?: {
    x: number;
    y: number;
  };
  data?: {
    content?: string;
    highlighted?: boolean;
  };
}

// 思维导图连接数据
export interface MindmapEdgeData {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'smoothstep' | 'simplebezier';
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