// AppSidebar 分页数据 API - Supabase 查询函数

import { createClient } from '@/lib/supabase/client';

import {
  PaginationParams,
  PaginationResponse,
  SidebarItem,
} from '../types/sidebar.types';

// TweetThread 完整数据类型（用于渲染器）
export interface TweetThreadData {
  id: string;
  topic: string;
  content_format: string;
  tweets: any[]; // 原始数据结构
  updated_at: string;
  created_at: string;
}

// 重试配置
interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, retryCount: number) => void;
}

// 带重试机制的请求函数
const fetchWithRetry = async <T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;

      if (onError) {
        onError(error as Error, i + 1);
      }

      if (!isLastAttempt) {
        // 指数退避策略
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, i)),
        );
      } else {
        throw error;
      }
    }
  }

  // TypeScript 需要这个 return，虽然实际上不会执行到
  throw new Error('Unexpected error in fetchWithRetry');
};

// 分页查询 TweetThread 数据
export async function fetchPaginatedSidebarData(
  params: PaginationParams,
  isRecoveryAttempt: boolean = false, // 添加标记防止无限递归
): Promise<PaginationResponse<SidebarItem>> {
  const { page, pageSize, userId } = params;

  // 参数验证
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('用户ID不能为空');
  }

  if (page < 1) {
    throw new Error('页码必须大于0');
  }

  if (pageSize < 1 || pageSize > 100) {
    throw new Error('每页数据量必须在1-100之间');
  }

  const supabase = createClient();

  return await fetchWithRetry(
    async () => {
      // 计算分页参数
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 新增：参数合理性预检查
      if (from < 0) {
        throw new Error('分页参数异常：起始位置不能为负数');
      }

      // 执行分页查询 - 获取完整数据
      const { data, count, error } = await supabase
        .from('tweet_thread')
        .select('*', { count: 'exact' })
        .eq('uid', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        // 检查是否为 offset 超出范围错误（PGRST103）
        if (
          !isRecoveryAttempt && // 防止无限递归
          (error.code === 'PGRST103' || 
           (error.message && 
            error.message.toLowerCase().includes('offset') && 
            error.message.toLowerCase().includes('rows')))
        ) {
          console.warn('Offset 超出范围，自动降级到第一页');
          // 自动降级：重新请求第一页
          return await fetchPaginatedSidebarData(
            {
              page: 1,
              pageSize,
              userId,
            },
            true, // 标记为恢复尝试
          );
        }
        
        console.error('Supabase query error:', error);
        throw new Error(`数据查询失败: ${error.message}`);
      }

      // 转换数据格式为 SidebarItem，包含完整的tweet数据
      const sidebarItems: SidebarItem[] = (data || []).map((item) => ({
        id: `tweet-${item.id}`,
        title: item.topic || '无标题',
        type: 'tweet' as const,
        createdAt: item.created_at,
        updatedAt: item.updated_at || item.created_at,
        // 包含完整的tweet数据
        tweetData: {
          id: item.id,
          topic: item.topic || '无标题',
          content_format: item.content_format || 'longform',
          tweets: item.tweets || [],
          updated_at: item.updated_at || item.created_at,
          created_at: item.created_at,
          user_input: item.user_input,
          draft: item.draft,
        },
      }));

      // 构建分页响应
      const response: PaginationResponse<SidebarItem> = {
        data: sidebarItems,
        total: count || 0,
        page,
        pageSize,
        hasMore: to < (count || 0) - 1,
      };

      return response;
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onError: (error, retryCount) => {
        console.warn(`数据查询重试 ${retryCount}/3:`, error.message);
      },
    },
  );
}

// 刷新单页数据（用于下拉刷新）
export async function refreshSidebarData(
  userId: string,
  pageSize: number = 20,
  forcePage: number = 1, // 新增强制页码参数，确保刷新时重置到指定页
): Promise<PaginationResponse<SidebarItem>> {
  return await fetchPaginatedSidebarData({
    page: forcePage, // 使用强制页码而非硬编码的1
    pageSize,
    userId,
  });
}

// 获取总数据量（用于计算总页数）
export async function getSidebarDataCount(userId: string): Promise<number> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('用户ID不能为空');
  }

  const supabase = createClient();

  return await fetchWithRetry(
    async () => {
      const { count, error } = await supabase
        .from('tweet_thread')
        .select('*', { count: 'exact', head: true })
        .eq('uid', userId);

      if (error) {
        console.error('Count query error:', error);
        throw new Error(`数据统计失败: ${error.message}`);
      }

      return count || 0;
    },
    {
      maxRetries: 2,
      retryDelay: 500,
    },
  );
}

// 预加载下一页数据（性能优化）
export async function preloadNextPage(params: PaginationParams): Promise<void> {
  try {
    const nextPageParams = {
      ...params,
      page: params.page + 1,
    };

    // 在后台预加载，不阻塞当前操作
    fetchPaginatedSidebarData(nextPageParams);
  } catch (error) {
    // 预加载失败不影响主流程
    console.warn('预加载下一页失败:', error);
  }
}

// 错误类型定义
export class SidebarAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public retryable?: boolean,
  ) {
    super(message);
    this.name = 'SidebarAPIError';
  }
}

// 检查网络连接状态
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout')
  );
}

// 错误恢复建议
export function getErrorRecoveryAction(error: Error): string {
  if (isNetworkError(error)) {
    return '请检查网络连接后重试';
  }

  if (error.message.includes('permission') || error.message.includes('auth')) {
    return '请重新登录后重试';
  }

  if (error.message.includes('rate limit')) {
    return '请求过于频繁，请稍后重试';
  }

  return '请稍后重试';
}
