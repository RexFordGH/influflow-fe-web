import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type GenerateThreadRequest,
  type HealthData,
  type ModifyOutlineData,
  type ModifyOutlineRequest,
  type ModifyTweetData,
  type ModifyTweetRequest,
  type TrendingTopicsResponse,
} from '@/types/api';
import { Outline } from '@/types/outline';


import { apiGet, apiPost, apiDirectGet } from './client';
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
  const _queryClient = useQueryClient();

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
  const _queryClient = useQueryClient();

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
  const _queryClient = useQueryClient();

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

// ========================
// Trending Topics 相关
// ========================

// 获取 Trending Topics
export function useTrendingTopics(topicType: string = 'ai') {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRENDING_TOPICS, topicType],
    queryFn: (): Promise<TrendingTopicsResponse> => {
      return apiDirectGet<TrendingTopicsResponse>(`https://influflowai-production.up.railway.app/trends/?topic_type=${topicType}`);
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
    queryFn: async (): Promise<string[]> => {
      // 暂时返回预定义的类型，如果后端有接口可以替换
      return ['ai', 'web3', 'investment', 'politics', 'tech'];
    },
    staleTime: 60 * 60 * 1000, // 1小时内数据视为新鲜
    gcTime: 2 * 60 * 60 * 1000, // 2小时缓存
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
