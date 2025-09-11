import { API_BASE_URL } from '@/constants/env';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { type IApiErrorResponse, type IBaseResponse } from '@/types/api';

const supabase = createClient();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: IApiErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 120000,
  isRetry: boolean = false,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // 每次请求时动态获取 accessToken，而不是从 localStorage 读取
  const accessToken = await useAuthStore.getState().getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const config: RequestInit = {
    headers,
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && !isRetry) {
        // 检查用户是否已经登出，如果已经登出就不要尝试刷新token
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated) {
          throw new ApiError('User has been logged out', 401);
        }

        try {
          // 使用 Supabase 的 refreshSession 来更新 token
          const {
            data: { session },
            error,
          } = await supabase.auth.refreshSession();

          if (error || !session) {
            console.error('Token refresh failed:', error);
            throw new Error('Failed to refresh token');
          }

          // 更新 AuthStore 中的用户信息，并更新token缓存
          useAuthStore.getState().setSession(
            {
              id: session.user.id,
              name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                'User',
              email: session.user.email || '',
              avatar:
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture,
            },
            session.access_token,
            session.expires_at ? session.expires_at * 1000 : undefined,
          );

          // 重试原始请求
          return apiRequest<T>(endpoint, options, timeoutMs, true);
        } catch (refreshError) {
          console.error('Token refresh failed, logging out:', refreshError);
          // 清除认证状态并重定向到登录页面
          useAuthStore.getState().logout();
          throw new ApiError('Session expired, please log in again.', 401);
        }
      }

      let errorData: IApiErrorResponse;
      let responseText = '';
      try {
        responseText = await response.text();
        errorData = JSON.parse(responseText);
      } catch {
        errorData = {
          detail:
            responseText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      throw new ApiError(
        `API Error: ${response.status}`,
        response.status,
        errorData,
      );
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    const parsed = JSON.parse(text);

    // 如果响应包含 BaseResponse 结构，检查并提取 data 字段
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'code' in parsed
    ) {
      const baseResponse = parsed as IBaseResponse<unknown>;

      if (baseResponse?.status !== 'success') {
        // 检测 code 42000 - 积分不足
        if (baseResponse.code === 42000) {
          useSubscriptionStore.getState().setShowNoCreditsModal(true);
        }

        throw new ApiError(
          baseResponse.message || `API Error: ${baseResponse.code}`,
          baseResponse.code,
          { detail: baseResponse.error || baseResponse.message },
        );
      }

      return baseResponse.data as T;
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 0);
    }

    throw new ApiError(
      `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiGet<T>(
  endpoint: string,
  timeoutMs?: number,
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, timeoutMs);
}

export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  timeoutMs?: number,
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    },
    timeoutMs,
  );
}

// 专门处理 BaseResponse 包装的 API 调用
export async function apiGetData<T>(
  endpoint: string,
  timeoutMs?: number,
): Promise<T> {
  return apiGet<T>(endpoint, timeoutMs);
}

export async function apiPostData<T>(
  endpoint: string,
  data?: unknown,
  timeoutMs?: number,
): Promise<T> {
  return apiPost<T>(endpoint, data, timeoutMs);
}

// 用于直接请求外部API，绕过代理
export async function apiDirectRequest<T>(
  fullUrl: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorData: IApiErrorResponse;
      let responseText = '';
      try {
        responseText = await response.text();
        errorData = JSON.parse(responseText);
      } catch {
        errorData = {
          detail:
            responseText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      throw new ApiError(
        `API Error: ${response.status}`,
        response.status,
        errorData,
      );
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    const parsed = JSON.parse(text);

    // 如果响应包含 BaseResponse 结构，检查并提取 data 字段
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'code' in parsed
    ) {
      const baseResponse = parsed as IBaseResponse<unknown>;

      if (baseResponse?.status !== 'success') {
        // 检测 code 42000 - 积分不足
        if (baseResponse.code === 42000) {
          useSubscriptionStore.getState().setShowNoCreditsModal(true);
        }

        throw new ApiError(
          baseResponse.message || `API Error: ${baseResponse.code}`,
          baseResponse.code,
          { detail: baseResponse.error || baseResponse.message },
        );
      }

      return baseResponse.data as T;
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 0);
    }

    throw new ApiError(
      `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiDirectGet<T>(
  fullUrl: string,
  timeoutMs?: number,
): Promise<T> {
  return apiDirectRequest<T>(fullUrl, { method: 'GET' }, timeoutMs);
}

// 图片生成 API
export async function generateImage(
  targetTweet: string,
  tweetThread: string,
  timeoutMs: number = 30000, // 图片生成可能需要更长时间
): Promise<string> {
  const response = await apiPost<{ image_url: string }>(
    '/api/twitter/generate-image',
    {
      target_tweet: targetTweet,
      tweet_thread: tweetThread,
    },
    timeoutMs,
  );
  return response.image_url;
}
