import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type HealthResponse,
  type GenerateThreadRequest,
  type GenerateThreadResponse,
  type ModifyTweetRequest,
  type ModifyTweetResponse,
  type ModifyOutlineRequest,
  type ModifyOutlineResponse,
} from '@/types/api';
import { apiGet, apiPost } from './client';

export const QUERY_KEYS = {
  HEALTH: ['health'] as const,
  TWITTER_GENERATE: ['twitter', 'generate'] as const,
  TWITTER_MODIFY_TWEET: ['twitter', 'modify-tweet'] as const,
  TWITTER_MODIFY_OUTLINE: ['twitter', 'modify-outline'] as const,
} as const;

export function useHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: () => apiGet<HealthResponse>('/health'),
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GenerateThreadRequest) =>
      apiPost<GenerateThreadResponse>('/api/twitter/generate', data, 30000), // 30秒超时
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ModifyTweetRequest) =>
      apiPost<ModifyTweetResponse>('/api/twitter/modify-tweet', data),
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ModifyOutlineRequest) =>
      apiPost<ModifyOutlineResponse>('/api/twitter/modify-outline', data),
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