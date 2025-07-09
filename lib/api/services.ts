import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type GenerateImageRequest,
  type GenerateThreadRequest,
  type HealthData,
  type ModifyOutlineData,
  type ModifyOutlineRequest,
  type ModifyTweetData,
  type ModifyTweetRequest,
  type TrendingTopicsResponse,
} from '@/types/api';
import { Outline } from '@/types/outline';

import { apiDirectGet, apiGet, apiPost, generateImage } from './client';
import {
  createLocalModifyOutlineResponse,
  createLocalModifyTweetResponse,
  localGenerateThreadResponse,
} from './local.res';

export const QUERY_KEYS = {
  HEALTH: ['health'] as const,
  TWITTER_GENERATE: ['twitter', 'generate'] as const,
  TWITTER_MODIFY_TWEET: ['twitter', 'modify-tweet'] as const,
  TWITTER_MODIFY_OUTLINE: ['twitter', 'modify-outline'] as const,
  TWITTER_GENERATE_IMAGE: ['twitter', 'generate-image'] as const,
  TRENDING_TOPICS: ['trending', 'topics'] as const,
} as const;

export function useHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: () => apiGet<HealthData>('/health'),
    refetchInterval: 30000, // 30秒刷新一次
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

// ========================
// Twitter Thread 相关
// ========================

// 生成 Twitter Thread
export function useGenerateThread() {
  return useMutation({
    mutationFn: async (data: GenerateThreadRequest): Promise<Outline> => {
      // 检查是否使用本地数据
      if (process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true') {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return localGenerateThreadResponse;
      }
      // 生产环境调用真实接口
      return apiPost<Outline>('/api/twitter/generate', data, 100000);
    },
    onSuccess: (data) => {
      console.log('Thread generated successfully:', data);
      // 可以在这里更新相关的查询缓存
    },
    onError: (error) => {
      console.error('Failed to generate thread:', error);
    },
  });
}

// 修改单个 Tweet
export function useModifyTweet() {
  return useMutation({
    mutationFn: async (data: ModifyTweetRequest): Promise<ModifyTweetData> => {
      // 检查是否使用本地数据
      if (process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true') {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return createLocalModifyTweetResponse(
          data.outline,
          data.tweet_number,
          data.modification_prompt,
        );
      }
      // 生产环境调用真实接口
      return apiPost<ModifyTweetData>(
        '/api/twitter/modify-tweet',
        data,
        100000,
      );
    },
    onSuccess: (data) => {
      console.log('Tweet modified successfully:', data);
      // 可以在这里更新相关的查询缓存
    },
    onError: (error) => {
      console.error('Failed to modify tweet:', error);
    },
  });
}

// 修改大纲
export function useModifyOutline() {
  return useMutation({
    mutationFn: async (
      data: ModifyOutlineRequest,
    ): Promise<ModifyOutlineData> => {
      // 检查是否使用本地数据
      if (process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true') {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return createLocalModifyOutlineResponse(
          data.original_outline,
          data.new_outline_structure,
        );
      }
      // 生产环境调用真实接口
      return apiPost<ModifyOutlineData>(
        '/api/twitter/modify-outline',
        data,
        100000,
      );
    },
    onSuccess: (data) => {
      console.log('Outline modified successfully:', data);
      // 可以在这里更新相关的查询缓存
    },
    onError: (error) => {
      console.error('Failed to modify outline:', error);
    },
  });
}

// 生成图片
export function useGenerateImage() {
  return useMutation({
    mutationFn: async (data: GenerateImageRequest): Promise<string> => {
      // 检查是否使用本地数据
      if (process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true') {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 基于请求内容生成一致的图片ID，这样同样的内容会得到同样的图片
        // 使用简单的字符串哈希避免 btoa 的编码问题
        const content = data.target_tweet || '';
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // 转换为32位整数
        }
        const contentHash = Math.abs(hash).toString(36).slice(0, 8);
        const timestamp = Date.now();

        // 返回一个带有内容标识和时间戳的模拟图片URL，便于测试
        return `https://picsum.photos/800/600?seed=${contentHash}&t=${timestamp}`;
      }
      // 生产环境调用真实接口
      return generateImage(data.target_tweet, data.tweet_thread, 60000);
    },
    onSuccess: (imageUrl) => {
      console.log('Image generated successfully:', imageUrl);
    },
    onError: (error) => {
      console.error('Failed to generate image:', error);
    },
  });
}

// ========================
// Trending Topics 相关
// ========================

// 获取 Trending Topics
export function useTrendingTopics(topicType: string = 'ai') {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRENDING_TOPICS, topicType],
    queryFn: (): Promise<TrendingTopicsResponse> => {
      return apiDirectGet<TrendingTopicsResponse>(
        `https://influflowai-production.up.railway.app/trends/?topic_type=${topicType}`,
      );
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟缓存
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

// 获取可用的话题类型（如果后端提供这个接口）
export function useTopicTypes() {
  return useQuery({
    queryKey: ['trending', 'topic-types'],
    queryFn: async (): Promise<{ id: string; label: string }[]> => {
      // 暂时返回预定义的类型，如果后端有接口可以替换
      return [
        { id: 'ai', label: 'AI' },
        { id: 'web3', label: 'Web3' },
        { id: 'investment', label: 'Investment' },
      ];
    },
    staleTime: 60 * 60 * 1000, // 1小时内数据视为新鲜
    gcTime: 2 * 60 * 60 * 1000, // 2小时缓存
  });
}

// ========================
// Twitter 发布相关
// ========================

// Twitter 授权状态响应类型
export interface TwitterAuthStatusResponse {
  authorized: boolean;
}

// Twitter 授权链接响应类型
export interface TwitterAuthUrlResponse {
  authorization_url: string;
}

// Twitter 推文数据类型
export interface TwitterTweetData {
  text: string;
  image_url?: string;
}

// Twitter 发布请求类型
export interface TwitterPostRequest {
  tweets: TwitterTweetData[];
  delay_seconds?: number;
}

// Twitter 发布响应类型
export interface TwitterPostResponse {
  total_tweets: number;
  successful_tweets: number;
  failed_tweets: number;
  first_tweet_id: string;
  thread_results: {
    tweet_number: number;
    text: string;
    image_url?: string;
    success: boolean;
    tweet_id?: string;
    error?: string;
  }[];
}

// 检查当前登录用户的 Twitter 授权状态
export function useCheckTwitterAuthStatus() {
  return useQuery({
    queryKey: ['twitter', 'auth-status'],
    queryFn: async (): Promise<TwitterAuthStatusResponse> => {
      return apiGet<TwitterAuthStatusResponse>('/auth/twitter/status');
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟缓存
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// 获取 Twitter 授权链接
export async function getTwitterAuthUrl(): Promise<TwitterAuthUrlResponse> {
  return apiGet<TwitterAuthUrlResponse>('/auth/twitter');
}

// 发布推文到 Twitter
export function usePostToTwitter() {
  return useMutation({
    mutationFn: async (requestData: TwitterPostRequest): Promise<TwitterPostResponse> => {
      return apiPost<TwitterPostResponse>('/api/twitter/post-thread', requestData);
    },
    onSuccess: (data) => {
      console.log('Post to Twitter successful:', data);
    },
    onError: (error) => {
      console.error('Failed to post to Twitter:', error);
    },
  });
}

// ========================
// 辅助函数
// ========================

// 错误处理辅助函数
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { response?: { detail?: string | unknown[] } };
    if (apiError.response?.detail) {
      if (typeof apiError.response.detail === 'string') {
        return apiError.response.detail;
      }
      if (Array.isArray(apiError.response.detail)) {
        return apiError.response.detail
          .map((err: any) => err.msg || 'Validation error')
          .join(', ');
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
