import { useMutation, useQuery } from '@tanstack/react-query';

import {
  ITrendsRecommendTweet,
  type CheckInvitationCodeResponse,
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
  TRENDING_RECOMMEND: ['trending', 'recommend'] as const,
  TRENDING_SEARCH: ['trending', 'query'] as const,
  VERIFY_INVITATION_CODE: ['verify', 'invitation-code'] as const,
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
      return apiPost<Outline>('/api/twitter/generate', data, 120000);
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
      return apiPost<ModifyOutlineData>(
        '/api/twitter/modify-outline',
        data,
        120000,
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
      return generateImage(data.target_tweet, data.tweet_thread, 120000);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL_TRENDING_TOPIC}/trends/?topic_type=${topicType}`,
      );
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟缓存
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

export function useTrendingRecommend(id: string, enabled?: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRENDING_RECOMMEND, id],
    queryFn: async () => {
      return apiDirectGet<{ tweets: ITrendsRecommendTweet[] }>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_TRENDING_TOPIC}/trends/recommend?id=${id}`,
      );
    },
    select: (data) => {
      return data.tweets;
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useTrendingSearch(query: string, enabled?: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRENDING_SEARCH, 'search', query],
    queryFn: async () => {
      // return Promise.resolve({
      //   tweets: StaticTrendsRecommend['82c6ba13-4c10-4813-b59e-68a6c5ff9929'],
      // });
      return apiDirectGet<{ tweets: ITrendsRecommendTweet[] }>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_TRENDING_TOPIC}/trends/query?query=${encodeURIComponent(query)}`,
      );
    },
    select: (data) => {
      return data.tweets;
    },
    enabled: enabled,
    staleTime: 10 * 60 * 1000, // 10分钟内数据视为新鲜，减少重复请求
    gcTime: 30 * 60 * 1000, // 30分钟缓存，保持更久的本地缓存
    refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
    refetchOnMount: false, // 组件重新挂载时不重新获取（如果有缓存）
    retry: false,
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

export interface TweetDetail {
  tweet_id: string;
  tweet_text: string;
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
  const currentUrl = window.location.href;
  return apiGet<TwitterAuthUrlResponse>(
    `/auth/twitter?redirect_url=${encodeURIComponent(currentUrl)}`,
  );
}

// 发布推文到 Twitter
export function usePostToTwitter() {
  return useMutation({
    mutationFn: async (
      requestData: TwitterPostRequest,
    ): Promise<TwitterPostResponse> => {
      return apiPost<TwitterPostResponse>(
        '/api/twitter/post-thread',
        requestData,
      );
    },
    onSuccess: (data) => {
      console.log('Post to Twitter successful:', data);
    },
    onError: (error) => {
      console.error('Failed to post to Twitter:', error);
    },
  });
}

export async function queryTweetDetail(
  tweet_url: string,
): Promise<TweetDetail> {
  return apiGet<TweetDetail>(
    `/api/twitter/query-tweet?tweet_url=${encodeURIComponent(tweet_url)}`,
  );
}

// ========================
// 邀请码验证相关
// ========================

export async function checkInvitationCode(
  code: string,
): Promise<CheckInvitationCodeResponse> {
  return apiGet<CheckInvitationCodeResponse>(
    `/api/check-invitation-code?code=${code.trim()}`,
  );
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
