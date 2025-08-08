import { IOutline } from './outline';

export interface IBaseResponse<T> {
  code: number;
  status: string;
  message: string;
  data: T;
  error?: null | string;
}

export interface IHealthData {
  timestamp: string;
  version?: string;
}

export type IHealthResponse = IBaseResponse<IHealthData>;

export type IContentFormat = 'longform' | 'thread' | 'deep_research';
export type IMode = 'lite' | 'analysis' | 'draft';

/**
 * @example 参考 lib/api/api.md 里的参数说明
 */
export interface IGenerateThreadRequest {
  session_id?: string;
  user_input: string;
  content_format: IContentFormat;
  mode: IMode;
}

export type IGenerateThreadResponse = IBaseResponse<IOutline>;

export interface IModifyTweetRequest {
  outline: IOutline;
  tweet_number: number;
  modification_prompt: string;
}

export interface IModifyTweetData {
  updated_tweet_content: string;
}

export type IModifyTweetResponse = IBaseResponse<IModifyTweetData>;

export interface IModifyOutlineRequest {
  original_outline: IOutline;
  new_outline_structure: IOutline;
}

export interface IModifyOutlineData {
  updated_outline: IOutline;
}

export type IModifyOutlineResponse = IBaseResponse<IModifyOutlineData>;

// Trending Topics 相关类型
export interface ITrendingTopic {
  id: string;
  title: string;
  type: string;
  value: number;
}

export interface ISuggestedTopic {
  topic: string;
  type: string;
}

export interface ITrendingTopicsResponse {
  trending_topics: ITrendingTopic[];
  suggested_topics: ISuggestedTopic[];
}

export interface ITrendsRecommendTweet {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number | null;
  type: string;
  cache_age: string;
  provider_name: string;
  provider_url: string;
  version: string;
}

// 图片生成相关类型
export interface IGenerateImageRequest {
  target_tweet: string;
  tweet_thread: string;
}

export interface IGenerateImageData {
  image_url: string;
}

export type IGenerateImageResponse = IBaseResponse<IGenerateImageData>;

// 邀请码验证相关类型
export interface ICheckInvitationCodeRequest {
  code: string;
}

export interface ICheckInvitationCodeResponse {
  valid: boolean;
  error?: string;
}

// API 错误响应类型
export interface IApiErrorResponse {
  detail:
    | string
    | Array<{
        loc: string[];
        msg: string;
        type: string;
      }>;
}
