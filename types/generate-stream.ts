// Generate Stream API 类型定义

import { IOutline } from './outline';

// 会话创建请求
export interface CreateGenerateSessionRequest {
  user_input: string;
  content_format: 'thread' | 'longform' | 'deep_research';
  mode?: 'lite' | 'analysis' | 'draft';
}

// 会话创建响应
export interface CreateGenerateSessionResponse {
  session_id: string;
}

// SSE 事件类型
export type GenerateEventType =
  | 'session.start'
  | 'analyze_input.start'
  | 'analyze_input.done'
  | 'fetch_url.start'
  | 'fetch_url.done'
  | 'web_search.start'
  | 'web_search.done'
  | 'generate_tweet.start'
  | 'generate_tweet.delta'
  | 'generate_tweet.done'
  | 'extract_outline.start'
  | 'extract_outline.done'
  | 'session.done'
  | 'error';

// 基础事件结构
export interface GenerateEventBase<T extends GenerateEventType, D = any> {
  event_type: T;
  message: string;
  data: D;
}

// 分析输入完成数据
export interface AnalyzeInputDoneData {
  topic: string;
  language: string;
}

// URL 获取数据
export interface FetchUrlData {
  urls: string[];
  fetched_failures?: string[];
}

// 网络搜索数据
export interface WebSearchData {
  search_queries?: string[];
  query_results?: Record<string, string[]>;
}

// 生成内容增量数据
export interface GenerateDeltaData {
  content: string;
}

// 会话完成数据
export interface SessionDoneData {
  outline: IOutline;
}

// 错误数据
export interface ErrorData {
  error: string;
}

// 所有事件类型的联合类型
export type GenerateEvent =
  | GenerateEventBase<'session.start'>
  | GenerateEventBase<'analyze_input.start'>
  | GenerateEventBase<'analyze_input.done', AnalyzeInputDoneData>
  | GenerateEventBase<'fetch_url.start', FetchUrlData>
  | GenerateEventBase<'fetch_url.done', FetchUrlData>
  | GenerateEventBase<'web_search.start', WebSearchData>
  | GenerateEventBase<'web_search.done', WebSearchData>
  | GenerateEventBase<'generate_tweet.start'>
  | GenerateEventBase<'generate_tweet.delta', GenerateDeltaData>
  | GenerateEventBase<'generate_tweet.done'>
  | GenerateEventBase<'extract_outline.start'>
  | GenerateEventBase<'extract_outline.done'>
  | GenerateEventBase<'session.done', SessionDoneData>
  | GenerateEventBase<'error', ErrorData>;