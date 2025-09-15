import { useCallback, useEffect, useRef, useState } from 'react';

import {
  connectGenerateStream,
  createGenerateSession,
} from '@/lib/api/article-generate';
import type { GenerateEvent } from '@/types/generate-stream';
import type { IOutline } from '@/types/outline';

interface UseArticleStreamingOptions {
  topic: string;
  contentFormat: 'thread' | 'longform' | 'deep_research';
  mode?: 'lite' | 'analysis' | 'draft';
  userInput?: string;
  enableTypewriter?: boolean;
  typewriterSpeed?: number;
  onComplete?: (outline: IOutline) => void;
  onError?: (err: Error) => void;
}

interface UseArticleStreamingReturn {
  isConnected: boolean;
  isStreaming: boolean;
  error: Error | null;
  streamingTitle?: string;
  streamingText: string;
  eventData: {
    analyzeInput?: { topic?: string; language?: string };
    fetchUrls?: string[];
    searchQueries?: string[];
    searchResults?: Record<string, string[]>;
  };
  reconnect: () => void;
  abort: () => void;
}

export function useArticleStreaming({
  topic,
  contentFormat,
  mode = 'lite',
  userInput,
  onComplete,
  onError,
}: UseArticleStreamingOptions): UseArticleStreamingReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingTitle, setStreamingTitle] = useState<string>();
  const [streamingText, setStreamingText] = useState('');

  // 保存会话信息
  const sessionIdRef = useRef<string | null>(null);
  const sseControllerRef = useRef<{
    abort: () => void;
    isFinished: () => boolean;
  } | null>(null);

  // 累积文本
  const fullTextRef = useRef('');
  // 保存额外的事件数据
  const [eventData, setEventData] = useState<{
    analyzeInput?: { topic?: string; language?: string };
    fetchUrls?: string[];
    searchQueries?: string[];
    searchResults?: Record<string, string[]>;
  }>({});

  // 处理 SSE 事件
  const handleEvent = useCallback(
    (evt: GenerateEvent) => {
      // 优先使用后端的 message 字段
      if (evt.message && evt.event_type !== 'generate_tweet.delta') {
        setStreamingTitle(evt.message);
      }

      switch (evt.event_type) {
        case 'generate_tweet.delta': {
          const delta = evt.data?.content ?? '';
          if (delta) {
            fullTextRef.current += delta; // 累加内容
            setStreamingText(fullTextRef.current);
            setIsStreaming(true);
          }
          break;
        }

        case 'session.start':
          // 使用后端的 message: "Start..."
          break;

        case 'analyze_input.start':
          // 使用后端的 message: "Starting user input analysis"
          break;

        case 'analyze_input.done':
          // 使用后端的 message: "Finished analyzing user input"
          // 保存分析结果
          if (evt.data) {
            setEventData(prev => ({
              ...prev,
              analyzeInput: {
                topic: evt.data.topic,
                language: evt.data.language,
              },
            }));
          }
          break;

        case 'fetch_url.start':
          // 使用后端的 message: "Starting fetching urls"
          // 保存 URLs
          if (evt.data?.urls) {
            setEventData(prev => ({
              ...prev,
              fetchUrls: evt.data.urls,
            }));
          }
          break;

        case 'fetch_url.done':
          // 使用后端的 message: "Finished fetching urls"
          // 更新 URLs 和失败列表
          if (evt.data?.urls) {
            setEventData(prev => ({
              ...prev,
              fetchUrls: evt.data.urls,
            }));
          }
          break;

        case 'web_search.start':
          // 使用后端的 message: "Starting web search"
          // 保存搜索查询
          if (evt.data?.search_queries) {
            setEventData(prev => ({
              ...prev,
              searchQueries: evt.data.search_queries,
            }));
          }
          break;

        case 'web_search.done':
          // 使用后端的 message: "Web search completed"
          // 保存搜索结果
          if (evt.data?.query_results) {
            setEventData(prev => ({
              ...prev,
              searchResults: evt.data.query_results,
            }));
          }
          break;

        case 'generate_tweet.start':
          // 使用后端的 message: "Starting generating content"
          break;

        case 'generate_tweet.done':
          // 使用后端的 message: "Content generation completed"
          break;

        case 'extract_outline.start':
          // 使用后端的 message: "Starting outline extraction"
          break;

        case 'extract_outline.done':
          // 使用后端的 message: "Outline extraction completed"
          break;

        case 'session.done': {
          // 使用后端的 message: "Done"
          setIsStreaming(false);
          setIsConnected(false);
          if (evt.data?.outline) {
            onComplete?.(evt.data.outline);
          }
          break;
        }

        case 'error': {
          const errorMsg = evt.data?.error || evt.message || '生成失败';
          const err = new Error(errorMsg);
          setError(err);
          setIsStreaming(false);
          setIsConnected(false);
          onError?.(err);
          break;
        }
      }
    },
    [onComplete, onError],
  );

  // 处理连接错误
  const handleError = useCallback(
    (err: Error) => {
      console.error('[useArticleStreaming] 错误:', err);
      setError(err);
      setIsStreaming(false);
      setIsConnected(false);
      onError?.(err);
    },
    [onError],
  );

  // 创建并连接会话
  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsConnected(false);
      setIsStreaming(false);

      // 创建会话
      const sessionId = await createGenerateSession({
        user_input: userInput || topic,
        content_format: contentFormat,
        mode,
      });

      sessionIdRef.current = sessionId;

      // 连接 SSE
      const controller = await connectGenerateStream(
        sessionId,
        handleEvent,
        handleError,
        {
          maxRetry: 3,
          retryInterval: 2000,
          openWhenHidden: true,
        },
      );

      sseControllerRef.current = controller;
      setIsConnected(true);
    } catch (err) {
      handleError(err as Error);
    }
  }, [topic, contentFormat, mode, userInput, handleEvent, handleError]);

  // 重新连接
  const reconnect = useCallback(() => {
    // 如果有现有连接，先断开
    if (sseControllerRef.current) {
      sseControllerRef.current.abort();
      sseControllerRef.current = null;
    }

    // 如果有会话ID，直接重连；否则重新创建会话
    if (sessionIdRef.current) {
      connectGenerateStream(
        sessionIdRef.current,
        handleEvent,
        handleError,
        {
          maxRetry: 3,
          retryInterval: 2000,
          openWhenHidden: true,
        },
      ).then((controller) => {
        sseControllerRef.current = controller;
        setIsConnected(true);
        setError(null);
      });
    } else {
      connect();
    }
  }, [connect, handleEvent, handleError]);

  // 断开连接
  const abort = useCallback(() => {
    if (sseControllerRef.current) {
      sseControllerRef.current.abort();
      sseControllerRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
  }, []);

  // 组件挂载时自动连接
  useEffect(() => {
    connect();

    // 清理
    return () => {
      if (sseControllerRef.current) {
        sseControllerRef.current.abort();
      }
    };
  }, []); // 只在挂载时执行一次

  return {
    isConnected,
    isStreaming,
    error,
    streamingTitle,
    streamingText,
    eventData,
    reconnect,
    abort,
  };
}