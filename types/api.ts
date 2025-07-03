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

export interface GenerateThreadRequest {
  user_input: string;
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
