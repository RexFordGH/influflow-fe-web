import { IContentFormat } from './api';

// 草案目的类型
export type IDraftPurpose =
  | 'educate'
  | 'inform'
  | 'entertain'
  | 'persuade'
  | 'inspire';

// 内容深度类型
export type IContentDepth = 'surface' | 'moderate' | 'deep';

// 草案数据接口
export interface IDraftData {
  topic: string;
  content_angle: string;
  key_points: string[];
  target_audience: string;
  output_language: string;
  purpose: IDraftPurpose;
  content_length: string;
  content_depth: IContentDepth;
  references: string[];
  requirements: string[];
}

// 草案生成请求接口
export interface IGenerateDraftRequest {
  user_input: string;
  session_id?: string;
}

// 草案生成响应接口
export interface IGenerateDraftResponse {
  draft: IDraftData;
  session_id: string;
  requires_review: boolean;
}

// 聊天消息类型
export type IChatMessageType = 'user' | 'assistant';

// 消息状态类型
export type MessageStatus = 'sending' | 'sent' | 'error';

// 聊天消息接口
export interface IChatMessage {
  id: string;
  type: IChatMessageType;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  metadata?: {
    draftUpdated?: boolean;
    isConfirmation?: boolean;
  };
}

// 草案确认状态接口
export interface IDraftConfirmationState {
  // 草案数据
  draft: IDraftData | null;
  session_id: string | null;

  // 对话历史
  messages: IChatMessage[];

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
export type IDraftAction =
  | {
      type: 'SET_DRAFT';
      payload: {
        draft: IDraftData;
        session_id: string;
        requires_review: boolean;
      };
    }
  | { type: 'ADD_MESSAGE'; payload: IChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONFIRMED'; payload: boolean }
  | { type: 'CLEAR_STATE' };

// 错误类型枚举
export enum IDraftErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

// 草案错误接口
export interface IDraftError {
  type: IDraftErrorType;
  message: string;
  recoverable?: boolean;
  retryAfter?: number;
  details?: Record<string, any>;
}

// 草案确认Context类型
export interface DraftConfirmationContextType {
  // 状态
  state: IDraftConfirmationState;

  // 动作
  generateDraft: (userInput: string) => Promise<void>;
  optimizeDraft: (userInput: string) => Promise<void>;
  generateTwitterContent: (userInput: string, sessionId: string, contentFormat: IContentFormat) => Promise<any>;
  addMessage: (message: Omit<IChatMessage, 'id' | 'timestamp'>) => void;
  clearState: () => void;

  // 确认相关
  confirmDraft: () => void;
  skipDraft: () => void;
}
