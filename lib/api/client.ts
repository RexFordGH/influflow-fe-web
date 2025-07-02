import { API_BASE_URL } from '@/constants/env';
import { type ApiErrorResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: ApiErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

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
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: ApiErrorResponse;
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

    return JSON.parse(text) as T;
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
