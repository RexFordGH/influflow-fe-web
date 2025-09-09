// Agent Chat API 类型定义

import { IOutline } from './outline';

export interface CreateAgentChatRequest {
  doc_id: string;
  user_message: string;
}

export interface CreateAgentChatResponse {
  chat_thread_id: string;
}

// SSE 事件类型
export type AgentChatEventType =
  | 'response.created'
  | 'response.in_progress'
  | 'reasoning.start'
  | 'reasoning.done'
  | 'web_search.start'
  | 'web_search.done'
  | 'message.start'
  | 'message.done'
  | 'write.start'
  | 'write.done'
  | 'chat.start'
  | 'chat.done'
  | 'error';

// 基础事件结构
export interface AgentChatEventBase<T extends AgentChatEventType, D = any> {
  event_type: T;
  message: string;
  data: D;
}

// 消息完成数据
export interface MessageDoneData {
  text: string;
}

// 写入完成数据
export interface WriteDoneData {
  outline: {
    topic: string;
    content_format: string;
    nodes: any[]; // 使用现有的 OutlineNode 类型
  };
}

// 聊天消息类型
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'streaming' | 'complete' | 'error';
  streamingTitle?: string; // 流式标题
  streamingContent?: string; // 流式内容
  streamingType?: string; // 消息类型
  outline?: IOutline;
}

// 用户消息
export interface UserMessage extends ChatMessage {
  type: 'user';
  characterCount: number;
}

// AI 消息
export interface AIMessage extends ChatMessage {
  type: 'ai';
  eventData?: AgentChatEventBase<AgentChatEventType>;
  reasoning?: string;
  sources?: string[];
}

// 所有事件类型的联合类型
export type AgentChatEvent =
  | AgentChatEventBase<'response.created'>
  | AgentChatEventBase<'response.in_progress'>
  | AgentChatEventBase<'reasoning.start'>
  | AgentChatEventBase<'reasoning.done'>
  | AgentChatEventBase<'web_search.start'>
  | AgentChatEventBase<'web_search.done'>
  | AgentChatEventBase<'message.start'>
  | AgentChatEventBase<'message.done', MessageDoneData>
  | AgentChatEventBase<'write.start'>
  | AgentChatEventBase<'write.done', WriteDoneData>
  | AgentChatEventBase<'chat.start'>
  | AgentChatEventBase<'chat.done', WriteDoneData>
  | AgentChatEventBase<'error', { error: string }>;
