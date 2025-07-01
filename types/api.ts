// API 响应基础类型
export interface HealthResponse {
  status: string;
  timestamp: string;
  version?: string;
}

// API 响应基础泛型类型
export interface BaseApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Twitter Thread 生成相关类型
export interface GenerateThreadRequest {
  topic: string;
}

export interface TweetContentItem {
  tweet_number: number;
  content: string;
  title: string;
}

export interface Tweet {
  title: string;
  tweets: TweetContentItem[];
}

export interface Outline {
  nodes: Tweet[];
  topic: string;
  total_tweets: number;
}

export interface GenerateThreadResponse {
  error: null | string;
  outline: Outline;
  status: 'success' | 'error';
}

// Twitter Tweet 修改相关类型
export interface OutlineInput {
  points: string[];
  structure: string;
}

export interface ModifyTweetRequest {
  outline: OutlineInput;
  tweet_number: number;
  modification_prompt: string;
}

export interface ModifyTweetData {
  original_tweet: Tweet;
  modified_tweet: Tweet;
  modification_reason: string;
}

export type ModifyTweetResponse = BaseApiResponse<ModifyTweetData>;

// 大纲修改相关类型
export interface ModifyOutlineRequest {
  original_outline: OutlineInput;
  new_outline_structure: OutlineInput;
}

export interface ModifyOutlineData {
  original_outline: Outline;
  modified_outline: Outline;
  changes_summary: string;
}

export type ModifyOutlineResponse = BaseApiResponse<ModifyOutlineData>;

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
