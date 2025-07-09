'use client';

import { Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';

/**
 * SSE 流式加载组件
 *
 * 取代了原有的 ContentGenerationLoading 组件，提供真实的服务器推送事件支持。
 *
 * 主要功能：
 * - 真实的 SSE 连接到后端服务器
 * - 单栏布局，专注于推文内容展示
 * - 打字机效果逐条显示生成的推文
 * - 完整的错误处理和重试机制
 * - 集成认证系统
 *
 * @param topic - 生成内容的主题
 * @param onComplete - 生成完成时的回调函数
 * @param onError - 发生错误时的回调函数
 * @param onBack - 用户点击返回时的回调函数
 */

// 定义SSE事件数据结构
interface ProgressData {
  stage: 'analysis' | 'generation';
  message: string;
  data?: any;
  topic_data?: {
    type: 'topic';
    topic: string;
  };
  section_data?: {
    type: 'section';
    title: string;
  };
  tweet_data?: {
    type: 'tweet';
    section_title: string;
    title: string;
    tweet_number: number;
    tweet_content: string;
  };
}

interface SseEventData {
  status: 'progress' | 'success' | 'error';
  data: ProgressData | any;
  message?: string;
}

interface GeneratedTweet {
  id: string;
  tweet_number: number;
  tweet_content: string;
  isComplete: boolean;
}

interface SseLoadingProps {
  topic: string;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

const Checkmark = () => (
  <motion.svg
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
    className="size-5 text-green-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.path pathLength={1} d="M20 6L9 17l-5-5" />
  </motion.svg>
);

const TypewriterText = ({
  text,
  onComplete,
  onProgress,
}: {
  text: string;
  onComplete?: () => void;
  onProgress?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
        onProgress?.(); // 触发滚动
      }, 30); // 50ms per character for typing effect

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      setTimeout(() => onComplete(), 500);
    }
  }, [currentIndex, text, onComplete]);

  return (
    <div className="">
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-1 inline-block h-5 w-0.5 bg-blue-500"
        />
      )}
    </div>
  );
};

export function SseLoading({
  topic,
  onComplete,
  onError,
  onBack,
}: SseLoadingProps) {
  const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweet[]>([]);
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [sseComplete, setSseComplete] = useState(false);
  const [completeData, setCompleteData] = useState<any>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { getAccessToken } = useAuthStore();

  // 自动滚动到最新内容
  const scrollToLatest = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // 处理打字机完成事件
  const handleTweetComplete = (tweetId: string) => {
    setGeneratedTweets((prev) =>
      prev.map((tweet) =>
        tweet.id === tweetId ? { ...tweet, isComplete: true } : tweet,
      ),
    );

    // 移动到下一条推文
    setCurrentTweetIndex((prev) => prev + 1);
  };

  const handleSseEvent = (eventData: SseEventData) => {
    if (eventData.status === 'progress') {
      const progressData = eventData.data as ProgressData;

      // 只处理推文类型的数据
      if (progressData.tweet_data && progressData.tweet_data.type === 'tweet') {
        const tweet = progressData.tweet_data;
        const newTweet: GeneratedTweet = {
          id: `tweet-${Date.now()}-${Math.random()}`,
          tweet_number: tweet.tweet_number,
          tweet_content: tweet.tweet_content,
          isComplete: false,
        };

        setGeneratedTweets((prev) => [...prev, newTweet]);

        // 新推文出现时自动滚动到最新内容
        setTimeout(() => scrollToLatest(), 100);
      }
    } else if (eventData.status === 'success') {
      setSseComplete(true);
      setCompleteData(eventData.data);
      // 延迟 2.5 秒后触发完成
      setTimeout(() => {
        setIsFinished(true);
        onComplete?.(eventData.data);
      }, 2500);
    } else if (eventData.status === 'error') {
      setIsError(true);
      setErrorMessage(eventData.message || 'Error occurred during generation');
      onError?.(eventData.message || 'Error occurred during generation');
    }
  };

  useEffect(() => {
    const connectToSSE = async () => {
      try {
        setIsConnecting(true);
        const token = await getAccessToken();

        if (!token) {
          setIsError(true);
          setErrorMessage('认证失败，请重新登录');
          onError?.('认证失败，请重新登录');
          return;
        }

        // 创建 AbortController 用于取消请求
        abortControllerRef.current = new AbortController();

        // 直接请求后端 SSE 端点
        const apiUrl =
          'https://influflow-api.up.railway.app/api/twitter/generate/stream';
        const url = new URL(apiUrl);
        url.searchParams.append('user_input', topic);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setIsConnecting(false);

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一行未完成的数据

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                setIsFinished(true);
                return;
              }

              try {
                const eventData: SseEventData = JSON.parse(dataStr);
                handleSseEvent(eventData);
              } catch (parseError) {
                console.error('解析SSE数据失败:', parseError, dataStr);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // 用户主动取消，不显示错误
        }

        console.error('SSE连接错误:', error);
        setIsError(true);
        setErrorMessage(error.message || '连接失败，请重试');
        onError?.(error.message || '连接失败，请重试');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToSSE();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [topic, getAccessToken, onError, onComplete]);

  // 监听当前推文变化和生成完成状态，确保滚动同步
  useEffect(() => {
    if (generatedTweets.length > 0) {
      setTimeout(() => scrollToLatest(), 100);
    }
  }, [currentTweetIndex, isFinished]);

  const handleRetry = useCallback(() => {
    setGeneratedTweets([]);
    setCurrentTweetIndex(0);
    setIsFinished(false);
    setIsError(false);
    setErrorMessage('');
    setIsConnecting(true);
    setSseComplete(false);
    setCompleteData(null);
  }, []);

  if (isError) {
    return (
      <div className="flex h-screen flex-col bg-[#FAFAFA]">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-[600px] flex-col items-center gap-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="size-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Failed to generate
              </h2>
              <p className="max-w-md text-gray-600">{errorMessage}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleRetry}
                  className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Retry
                </button>
                {onBack && (
                  <button
                    onClick={onBack}
                    className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    Back
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#FAFAFA]">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* 头部信息 */}
          <div className="mb-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 3,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              className="mb-6 flex items-center justify-center"
            >
              <Image
                src="/icons/face.svg"
                alt="thinking"
                width={80}
                height={80}
                className="mx-auto"
              />
            </motion.div>
          </div>

          {/* 推文内容区域 */}
          <div
            ref={scrollContainerRef}
            className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg  p-8"
          >
            <h2 className="mb-[24px] text-center text-2xl font-semibold text-gray-800">
              {topic}
            </h2>

            {generatedTweets.length === 0 && (
              <div className="text-center text-gray-500">
                <p>Generating contents...</p>
              </div>
            )}

            <div className="space-y-8">
              {generatedTweets.map((tweet, index) => {
                const shouldShow = index <= currentTweetIndex;
                const isCurrentTweet = index === currentTweetIndex;

                if (!shouldShow) return null;

                return (
                  <motion.div
                    key={tweet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-[16px] leading-relaxed text-[#757575]"
                  >
                    {isCurrentTweet ? (
                      <TypewriterText
                        text={tweet.tweet_content}
                        onComplete={() => handleTweetComplete(tweet.id)}
                        onProgress={() => scrollToLatest()}
                      />
                    ) : (
                      <div className="">{tweet.tweet_content}</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
