'use client';

import { cn } from '@heroui/react';

import type { ChatMessage } from '@/types/agent-chat';

import { StreamingTypewriter } from '../sseChat/StreamingTypewriter';

interface AIMessageProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export const StreamMessage: React.FC<AIMessageProps> = ({
  message,
  isStreaming,
}) => {
  return (
    <div className="mb-6 flex max-w-full flex-col gap-[6px]">
      {/* AI 头像 */}
      {/* <Image src={'/icons/influxy.svg'} width={84} height={24} /> */}

      {/* 消息内容 */}
      <div className={cn('text-[14px] max-w-full overflow-hidden')}>
        {message.status === 'streaming' ? (
          <div className="space-y-4">
            {/* 流式标题 - 始终显示在顶部，使用不同样式 */}
            {message.streamingTitle && (
              <div className="text-[16px] rounded-md py-2 font-medium text-gray-700 text-center">
                <StreamingTypewriter
                  streamingContent={message.streamingTitle}
                  isStreaming={true}
                  typeSpeed={15} // 标题打字速度更快
                  showCursor={false} // 标题不显示光标
                />
              </div>
            )}
            {/* 流式内容 - 正文样式 */}
            {message.streamingContent && (
              <div className="mt-3 text-[#8C8C8C]">
                <StreamingTypewriter
                  streamingContent={message.streamingContent}
                  isStreaming={true}
                />
              </div>
            )}
            {/* 如果没有内容，显示加载中 */}
            {!message.streamingTitle && !message.streamingContent && (
              <div className="flex items-center gap-2">
                <div className="size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 完成状态 - 如果有标题和内容，分开显示 */}
            {message.streamingTitle && (
              <div className="rounded-md py-2 text-sm font-medium text-gray-700 text-center">
                {message.streamingTitle}
              </div>
            )}
            <div className="break-all text-[#8C8C8C]">
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
