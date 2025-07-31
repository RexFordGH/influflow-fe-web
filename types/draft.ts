// 草案目的类型
export type DraftPurpose =
  | 'educate'
  | 'inform'
  | 'entertain'
  | 'persuade'
  | 'inspire';

// 内容深度类型
export type ContentDepth = 'surface' | 'moderate' | 'deep';

// 草案数据接口
export interface DraftData {
  topic: string;
  content_angle: string;
  key_points: string[];
  target_audience: string;
  output_language: string;
  purpose: DraftPurpose;
  content_length: string;
  content_depth: ContentDepth;
  references: string[];
  requirements: string[];
}

// 草案生成请求接口
export interface GenerateDraftRequest {
  user_input: string;
  session_id?: string;
}

// 草案生成响应接口
export interface GenerateDraftResponse {
  draft: DraftData;
  session_id: string;
  requires_review: boolean;
}

// 聊天消息类型
export type ChatMessageType = 'user' | 'assistant';

// 消息状态类型
export type MessageStatus = 'sending' | 'sent' | 'error';

// 聊天消息接口
export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  metadata?: {
    draftUpdated?: boolean;
    isConfirmation?: boolean;
  };
}

// 草案确认状态接口
export interface DraftConfirmationState {
  // 草案数据
  draft: DraftData | null;
  session_id: string | null;

  // 对话历史
  messages: ChatMessage[];

  // UI状态
  isLoading: boolean;
  isThinking: boolean;

  // 确认状态
  isConfirmed: boolean;
  requires_review: boolean;

  // 错误处理
  error: string | null;
}

// 草案确认Action类型
export type DraftAction =
  | {
      type: 'SET_DRAFT';
      payload: {
        draft: DraftData;
        session_id: string;
        requires_review: boolean;
      };
    }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONFIRMED'; payload: boolean }
  | { type: 'CLEAR_STATE' };

// 错误类型枚举
export enum DraftErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

// 草案错误接口
export interface DraftError {
  type: DraftErrorType;
  message: string;
  recoverable?: boolean;
  retryAfter?: number;
  details?: Record<string, any>;
}

// 草案确认Context类型
export interface DraftConfirmationContextType {
  // 状态
  state: DraftConfirmationState;

  // 动作
  generateDraft: (userInput: string) => Promise<void>;
  optimizeDraft: (userInput: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearState: () => void;

  // 确认相关
  confirmDraft: () => void;
  skipDraft: () => void;
}

// 内容格式类型（与现有系统兼容）
export type ContentFormat = 'longform' | 'thread';
