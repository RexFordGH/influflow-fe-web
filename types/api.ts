import { User } from '@/stores/authStore';
import { Outline } from './outline';

export interface BaseResponse<T> {
  code: number;
  status: string;
  message: string;
  data: T;
  error?: null | string;
}

export interface HealthData {
  timestamp: string;
  version?: string;
}

export type HealthResponse = BaseResponse<HealthData>;

export type ContentFormat = 'longform' | 'thread'

export interface GenerateThreadRequest {
  user_input: string;
  content_format: ContentFormat;
  personalization?: Pick<
    User,
    'account_name' | 'tone' | 'bio' | 'tweet_examples'
  >;
}

export type GenerateThreadResponse = BaseResponse<Outline>;

export interface ModifyTweetRequest {
  outline: Outline;
  tweet_number: number;
  modification_prompt: string;
}

export interface ModifyTweetData {
  updated_tweet_content: string;
}

export type ModifyTweetResponse = BaseResponse<ModifyTweetData>;

export interface ModifyOutlineRequest {
  original_outline: Outline;
  new_outline_structure: Outline;
}

export interface ModifyOutlineData {
  updated_outline: Outline;
}

export type ModifyOutlineResponse = BaseResponse<ModifyOutlineData>;

// Trending Topics 相关类型
export interface TrendingTopic {
  title: string;
  type: string;
  value: number;
}

export interface SuggestedTopic {
  topic: string;
  type: string;
}

export interface TrendingTopicsResponse {
  trending_topics: TrendingTopic[];
  suggested_topics: SuggestedTopic[];
}

// 图片生成相关类型
export interface GenerateImageRequest {
  target_tweet: string;
  tweet_thread: string;
}

export interface GenerateImageData {
  image_url: string;
}

export type GenerateImageResponse = BaseResponse<GenerateImageData>;

// 邀请码验证相关类型
export interface VerifyInvitationCodeRequest {
  code: string;
}

export interface VerifyInvitationCodeResponse {
  valid: boolean;
  error?: string;
}

// API 错误响应类型
export interface ApiErrorResponse {
  detail:
    | string
    | Array<{
        loc: string[];
        msg: string;
        type: string;
      }>;
}
