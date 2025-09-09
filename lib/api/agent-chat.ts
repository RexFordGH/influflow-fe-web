import {
  EventSourceMessage,
  fetchEventSource,
} from '@microsoft/fetch-event-source';

import { apiPost } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import type {
  AgentChatEvent,
  CreateAgentChatRequest,
  CreateAgentChatResponse,
} from '@/types/agent-chat';

/**
 * 创建 Agent 聊天会话
 */
export async function createAgentChat(
  docId: string,
  userMessage: string,
): Promise<string> {
  const payload: CreateAgentChatRequest = {
    doc_id: docId,
    user_message: userMessage,
  };

  const response = await apiPost<CreateAgentChatResponse>(
    '/api/agent/chat/create',
    payload,
    30000, // 30秒超时
  );

  return response.chat_thread_id;
}

interface ConnectOptions {
  /** 最大重连次数 */
  maxRetry?: number;
  /** 重连间隔（毫秒） */
  retryInterval?: number;
  /** 是否在页面隐藏时保持连接 */
  openWhenHidden?: boolean;
}

interface SSEController {
  abort: () => void;
  isFinished: () => boolean;
}

/**
 * 基于 @microsoft/fetch-event-source 的稳定版 SSE 连接
 * - 支持自定义 Header（Authorization）
 * - 自动重连（可配置次数和间隔）
 * - 过滤空事件和心跳
 * - 正常完成时不会误触发 onError
 */
export async function connectAgentChatStream(
  chatThreadId: string,
  onEvent: (event: AgentChatEvent) => void,
  onError: (error: Error) => void,
  options: ConnectOptions = {},
): Promise<SSEController> {
  const { maxRetry = 3, retryInterval = 2000, openWhenHidden = true } = options;

  let retryCount = 0;
  let finished = false; // 标记是否正常结束
  const abortController = new AbortController();

  // 动态获取 token
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const accessToken = await useAuthStore.getState().getAccessToken();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  };

  // 开始连接
  const startConnection = async () => {
    try {
      const authHeaders = await getAuthHeaders();

      await fetchEventSource(
        `/api/agent/chat/stream?chat_thread_id=${chatThreadId}`,
        {
          method: 'GET',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,

          onmessage(msg: EventSourceMessage) {
            console.log('[SSE] 收到消息:', msg);
            const raw = msg.data?.trim();

            // 忽略 ping / 心跳
            if (!raw || raw.startsWith(':')) {
              console.log('[SSE] 忽略心跳/空行');
              return;
            }

            try {
              const data: AgentChatEvent = JSON.parse(raw);
              console.log('[SSE] 解析成功:', data);
              onEvent(data);

              // 如果收到 chat.done 事件 → 认为对话已完成
              if (data.event_type === 'chat.done') {
                finished = true;
                console.log('[SSE] 聊天完成，准备关闭连接');
                // 稍后关闭连接，确保最后的消息被处理
                setTimeout(() => {
                  abortController.abort();
                }, 100);
              }
            } catch (err) {
              console.error('[SSE] 事件解析失败:', raw, err);
              // 仅记录，不中断整个 SSE
            }
          },

          async onopen(res) {
            if (res.ok && res.status === 200) {
              console.log('[SSE] 连接已建立');
              retryCount = 0;
            } else if (res.status === 401) {
              console.error('[SSE] 认证失败，尝试刷新 token');
              // 刷新 token 后重试
              throw new Error('Authentication required');
            } else {
              console.error(
                '[SSE] 服务端连接被拒绝:',
                res.status,
                res.statusText,
              );
              throw new Error(`SSE Connection rejected: ${res.status}`);
            }
          },

          onerror(err) {
            // 如果是主动中止，不处理错误
            if (abortController.signal.aborted) {
              console.log('[SSE] 连接已主动关闭');
              return;
            }

            if (finished) {
              console.log('[SSE] 已正常结束，不再重连');
              throw err; // 阻止内置重连
            }

            console.error('[SSE] 连接错误:', err);
            retryCount++;

            if (retryCount > maxRetry) {
              console.error('[SSE] 达到最大重试次数，停止重连');
              onError(new Error('SSE 连接失败（已达最大重试次数）'));
              throw err; // 阻止内置重连
            }

            console.log(
              `[SSE] ${retryInterval}ms 后重连（${retryCount}/${maxRetry}）`,
            );
            // 返回重连间隔（毫秒）
            return retryInterval;
          },

          openWhenHidden,
        },
      );
    } catch (error) {
      if (!abortController.signal.aborted && !finished) {
        console.error('[SSE] 连接异常:', error);
        onError(error as Error);
      }
    }
  };

  // 启动连接
  startConnection();

  // 返回控制器
  return {
    abort: () => {
      console.log('[SSE] 手动关闭连接');
      abortController.abort();
    },
    isFinished: () => finished,
  };
}
