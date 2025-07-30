import { useCallback, useEffect, useRef, useState } from 'react';
import { ContentFormat } from '@/types/api';
import { Outline } from '@/types/outline';
import { addToast } from '@/components/base/toast';
import { useAuthStore } from '@/stores/authStore';

interface StageInfo {
  id: string;
  name: string;
  displayName: string;
  status: 'pending' | 'in_progress' | 'completed';
  content?: string;
}

interface SSEProgressData {
  event_type: string;
  stage: string;
  message: string;
  data?: {
    type?: string;
    topic?: string;
    section_title?: string;
    tweet_number?: number;
    tweet_title?: string;
    tweet_content?: string;
    outline?: any;
  };
}

interface UseSSEGenerationProps {
  enabled: boolean;
  topic: string;
  contentFormat: ContentFormat;
  onComplete: (data: Outline) => void;
  onError: (error: Error) => void;
}

export function useSSEGeneration({
  enabled,
  topic,
  contentFormat,
  onComplete,
  onError,
}: UseSSEGenerationProps) {
  // 使用 ref 保存 topic 以避免重复连接
  const lastTopicRef = useRef<string>('');
  const [stages, setStages] = useState<Record<string, StageInfo>>({
    extract_url: {
      id: 'extract_url',
      name: 'extract_url',
      displayName: '提取URL内容',
      status: 'pending',
    },
    analysis_user_input: {
      id: 'analysis_user_input',
      name: 'analysis_user_input',
      displayName: '分析用户输入',
      status: 'pending',
    },
    web_search: {
      id: 'web_search',
      name: 'web_search',
      displayName: '搜索相关内容',
      status: 'pending',
    },
    generate_tweet: {
      id: 'generate_tweet',
      name: 'generate_tweet',
      displayName: '生成内容',
      status: 'pending',
    },
  });

  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedContentRef = useRef<string>('');
  const isConnectingRef = useRef(false);

  const updateStageStatus = useCallback(
    (stageName: string, status: StageInfo['status']) => {
      setStages((prev) => ({
        ...prev,
        [stageName]: {
          ...prev[stageName],
          status,
        },
      }));
    },
    [],
  );

  const processProgressEvent = useCallback(
    (data: SSEProgressData) => {
      const { event_type, stage, data: progressData } = data;

      if (event_type === 'stage_start') {
        updateStageStatus(stage, 'in_progress');
        setCurrentStage(stage);
        if (stage === 'generate_tweet') {
          setStreamContent('');
          accumulatedContentRef.current = '';
        }
      } else if (event_type === 'stage_end') {
        updateStageStatus(stage, 'completed');
      } else if (event_type === 'stage_progress' && stage === 'generate_tweet') {
        // 处理生成内容的流式数据
        if (progressData?.type === 'topic') {
          accumulatedContentRef.current = `主题: ${progressData.topic}\n\n`;
          setStreamContent(accumulatedContentRef.current);
        } else if (progressData?.type === 'section') {
          accumulatedContentRef.current += `\n## ${progressData.section_title}\n\n`;
          setStreamContent(accumulatedContentRef.current);
        } else if (progressData?.type === 'tweet') {
          const tweetContent = `${progressData.tweet_number}. ${progressData.tweet_title}\n${progressData.tweet_content}\n\n`;
          accumulatedContentRef.current += tweetContent;
          setStreamContent(accumulatedContentRef.current);
        }
      }
    },
    [updateStageStatus],
  );

  const connectSSE = useCallback(async () => {
    if (!enabled || !topic || isConnectingRef.current) return;
    
    isConnectingRef.current = true;

    try {
      // 获取 access token
      const accessToken = await useAuthStore.getState().getAccessToken();
      
      if (!accessToken) {
        setError('未登录，请先登录');
        onError(new Error('未登录'));
        return;
      }

      setError(null);
      setIsConnected(false);

      // 构建请求数据
      const requestData = {
        user_input: topic.trim(),
        content_format: contentFormat,
      };
      
      // 将请求数据编码为URL参数
      const encodedData = encodeURIComponent(JSON.stringify(requestData));
      
      // 先取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 创建新的 AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 使用SSE代理端点
      const url = `/api/sse-proxy/twitter/generate/stream?data=${encodedData}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsConnected(true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 处理流式数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.status === 'progress' && parsed.data) {
                processProgressEvent(parsed.data);
              } else if (parsed.status === 'success' && parsed.data?.is_final) {
                updateStageStatus('generate_tweet', 'completed');
                
                // 转换数据格式
                const outlineData: Outline = {
                  id: parsed.data.id || parsed.data.thread_id,
                  content_format: parsed.data.content_format,
                  nodes: parsed.data.nodes.map((node: any) => ({
                    title: node.title,
                    tweets: node.tweets.map((tweet: any) => ({
                      tweet_number: tweet.tweet_number,
                      content: tweet.content,
                      title: tweet.title,
                      image_url: tweet.image_url,
                    })),
                  })),
                  topic: parsed.data.topic,
                  total_tweets: parsed.data.total_tweets,
                  updatedAt: Date.now(),
                };
                
                onComplete(outlineData);
                // 完成后清理
                abortControllerRef.current = null;
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('SSE error:', error);
      setIsConnected(false);
      
      if (error.name !== 'AbortError') {
        setError(error.message);
        onError(error);
        addToast({
          title: '连接错误',
          description: error.message,
          color: 'danger',
          timeout: 3000,
        });
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [enabled, topic, contentFormat, processProgressEvent, updateStageStatus, onComplete, onError]);

  useEffect(() => {
    let mounted = true;
    
    // 只有在 topic 真正改变时才连接
    if (enabled && topic && topic !== lastTopicRef.current && mounted) {
      lastTopicRef.current = topic;
      connectSSE();
    }
    
    return () => {
      mounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [enabled, topic]); // 不包含 connectSSE 避免循环

  // 当组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      lastTopicRef.current = '';
    };
  }, []);

  return {
    stages,
    currentStage,
    streamContent,
    error,
    isConnected,
  };
}