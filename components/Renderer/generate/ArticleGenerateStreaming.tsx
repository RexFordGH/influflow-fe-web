'use client';

import { Button, Image } from '@heroui/react';
import * as Icon from '@phosphor-icons/react';

import { useArticleStreaming } from '@/hooks/useArticleStreaming';
import type { ChatMessage } from '@/types/agent-chat';
import { IContentFormat, IMode } from '@/types/api';
import { IOutline } from '@/types/outline';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { StreamMessage } from './StreamMessage';

interface ArticleGenerateStreamingProps {
  topic: string;
  contentFormat: IContentFormat;
  mode?: IMode;
  userInput?: string;
  onBack: () => void;
  onComplete: (outline: IOutline) => void;
  onError?: (error: Error) => void;
}

export function ArticleGenerateStreaming({
  topic,
  contentFormat,
  mode = 'lite',
  userInput,
  onBack,
  onComplete,
  onError,
}: ArticleGenerateStreamingProps) {
  const {
    streamingTitle,
    streamingText,
    isStreaming,
    error,
    reconnect,
    abort,
  } = useArticleStreaming({
    topic,
    contentFormat,
    mode: mode || 'lite',
    userInput,
    onComplete,
    onError,
  });

  // 创建滚动容器的引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 当内容更新时自动滚动到底部
  useEffect(() => {
    if (scrollContainerRef.current && (streamingText || streamingTitle)) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [streamingText, streamingTitle]);

  // 构造 AIMessage 需要的消息对象
  const aiMessage: ChatMessage = {
    id: 'streaming-generate',
    type: 'ai',
    content: '',
    timestamp: new Date(),
    status: isStreaming ? 'streaming' : error ? 'error' : 'complete',
    streamingTitle,
    streamingContent: streamingText,
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 主内容区域 */}
      <div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
        {/* Logo 部分 - 固定高度 */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 3,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          <Image
            src="/icons/influxy.svg"
            alt="thinking"
            width={168}
            height={48}
          />
        </motion.div>

        <div
          className="flex w-full max-w-3xl flex-col rounded-lg "
          style={{ maxHeight: 'calc(100vh - 120px - 100px)' }}
        >
          {/* 内容滚动容器 */}
          <div ref={scrollContainerRef} className="overflow-y-auto p-8">
            <StreamMessage message={aiMessage} isStreaming={isStreaming} />
          </div>

          {/* 错误信息 - 固定在底部 */}
          {error && (
            <div className="flex-shrink-0 border-t border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={reconnect}
                  startContent={<Icon.ArrowCounterClockwise size={16} />}
                >
                  retry
                </Button>
                <span className="text-sm text-red-500">{error.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
