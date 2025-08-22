'use client';

import { cn, Image } from '@heroui/react';

import type { ChatMessage } from '@/types/agent-chat';

import { StreamingTypewriter } from './StreamingTypewriter';

interface AIMessageProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  message,
  isStreaming,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-[6px]">
      {/* AI 头像 */}
      <Image src={'/icons/influxy.svg'} width={84} height={24} />

      {/* 消息内容 */}
      <div className={cn('text-[14px]')}>
        {message.status === 'streaming' ? (
          <div className="space-y-2">
            {/* 流式标题 - 小标题样式 */}
            {message.streamingTitle && (
              <div className="font-medium text-black">
                {message.streamingTitle}
              </div>
            )}
            {/* 流式内容 - 正文样式 */}
            {message.streamingContent && (
              <div className="text-black/70">
                <StreamingTypewriter
                  streamingContent={message.streamingContent}
                  isStreaming={true}
                />
              </div>
            )}
            {/* 如果没有内容，显示加载中 */}
            {!message.streamingTitle && !message.streamingContent && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 完成状态 - 如果有标题和内容，分开显示 */}
            {message.streamingTitle && (
              <div className="font-medium text-black">
                {message.streamingTitle}
              </div>
            )}
            <div className="whitespace-pre-wrap break-words text-black/70">
              {message.content || message.streamingContent}
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {message.status === 'error' && (
          <div className="mt-2 text-sm text-red-500">
            Network error, please retry
          </div>
        )}
      </div>
    </div>
  );
};
