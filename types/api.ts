import { Outline } from './outline';

export interface HealthResponse {
  status: string;
  timestamp: string;
  version?: string;
}

export interface GenerateThreadRequest {
  user_input: string;
}
export interface GenerateThreadResponse {
  error: null | string;
  outline: Outline;
  status: string;
}

export interface ModifyTweetRequest {
  outline: Outline;
  tweet_number: number;
  modification_prompt: string;
}

export interface ModifyTweetResponse {
  updated_tweet_content: string;
  tweet_number: number;
  modification_prompt: string;
}

export interface ModifyOutlineRequest {
  original_outline: Outline;
  new_outline_structure: Outline;
}

export interface ModifyOutlineResponse {
  status: string;
  updated_outline: Outline;
  error: string;
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
