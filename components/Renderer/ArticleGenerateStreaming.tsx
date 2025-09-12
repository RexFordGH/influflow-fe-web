'use client';

import { Button } from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import * as Icon from '@phosphor-icons/react';

import { useArticleStreaming } from '@/hooks/useArticleStreaming';
import { IContentFormat, IMode } from '@/types/api';
import { IOutline } from '@/types/outline';
import type { ChatMessage } from '@/types/agent-chat';

import { AIMessage } from './sseChat/AIMessage';

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

  const handleBack = () => {
    abort();
    onBack();
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
            className="size-8"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <h1 className="text-lg font-medium text-gray-900">{topic}</h1>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div className="w-full max-w-3xl">
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <AIMessage message={aiMessage} isStreaming={isStreaming} />

            {/* 错误状态下显示重试按钮 */}
            {error && (
              <div className="mt-6 flex items-center gap-4">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={reconnect}
                  startContent={<Icon.ArrowsClockwise size={16} />}
                >
                  重试
                </Button>
                <span className="text-sm text-red-500">{error.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}