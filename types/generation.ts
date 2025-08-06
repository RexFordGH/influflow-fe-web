import { IContentFormat, IMode } from './api';
import { IOutline } from './outline';

// 生成模式配置接口
export interface GenerationModeConfig {
  mode: IMode; // 模式标识
  requiresDraftConfirmation: boolean; // 是否需要草案确认
  requiresSessionId: boolean; // 是否需要会话ID
  requiresUserInput: boolean; // 是否需要用户输入
  displayName: string; // 显示名称
  description: string; // 模式描述
  apiEndpoint?: string; // 自定义API端点
  timeout?: number; // 请求超时时间
}

// 统一的生成请求接口
export interface GenerationRequest {
  mode: IMode; // 生成模式
  user_input: string; // 用户输入（可为空）
  content_format: IContentFormat; // 内容格式
  session_id?: string; // 会话ID（仅draft模式需要）
}

// 生成阶段类型
export type GenerationPhase =
  | 'init' // 初始化
  | 'mode_select' // 模式选择
  | 'draft_confirm' // 草案确认（仅draft模式）
  | 'generating' // 正在生成
  | 'completed' // 生成完成
  | 'error'; // 生成错误

// 生成上下文接口
export interface GenerationContext {
  mode: IMode;
  phase: GenerationPhase;
  topic: string;
  contentFormat: IContentFormat;
  userInput?: string;
  sessionId?: string;
  retryCount: number;
  startTime: number;
}

// 生成参数类型
export interface GenerationParams {
  topic: string;
  contentFormat: IContentFormat;
  userInput?: string;
  sessionId?: string;
  mode?: IMode;
}

// 生成事件接口
export interface GenerationEvents {
  onPhaseChange: (phase: GenerationPhase) => void;
  onModeChange: (mode: IMode) => void;
  onProgress: (step: number, total: number) => void;
  onComplete: (data: IOutline) => void;
  onError: (error: Error) => void;
}

// 生成配置接口
export interface GenerationConfig {
  defaultMode: IMode;
  enableModeSwitch: boolean;
  availableModes: IMode[];
  showModeDescription: boolean;
  enableRetry: boolean;
  maxRetries: number;
  timeout: number;
}

// 生成内容类型
export interface GeneratedContent {
  outline: IOutline;
  mode: IMode;
  generatedAt: number;
}

// Hook返回类型扩展
export interface UseGenerationStateReturn extends GenerationEvents {
  // 状态
  context: GenerationContext;
  isGenerating: boolean;
  currentStep: number;
  totalSteps: number;
  error: Error | null;

  // 数据
  rawAPIData: IOutline | null;
  generatedContent: GeneratedContent | null;

  // 方法
  setMode: (mode: IMode) => void;
  startGeneration: (params: GenerationParams) => void;
  resetGeneration: () => void;
  retryGeneration: () => void;
}

// 生成流程编排器接口
export interface GenerationOrchestratorProps {
  mode: IMode; // 当前模式
  topic: string; // 生成主题
  contentFormat: IContentFormat; // 内容格式
  userInput?: string; // 用户输入
  sessionId?: string; // 会话ID
  onComplete: (data: IOutline) => void; // 完成回调
  onError: (error: Error) => void; // 错误回调
  onBack: () => void; // 返回回调
}

// 模式特定参数映射
export type ModeSpecificParams = {
  draft: {
    session_id: string;
    user_input?: string;
  };
  lite: {
    user_input: string;
    session_id?: never;
  };
  analysis: {
    user_input: string;
    session_id?: never;
  };
};

// 参数构建函数签名
export type BuildGenerationRequestFunction = <T extends IMode>(
  mode: T,
  params: ModeSpecificParams[T],
  contentFormat: IContentFormat,
) => GenerationRequest;

// 错误类型定义
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
