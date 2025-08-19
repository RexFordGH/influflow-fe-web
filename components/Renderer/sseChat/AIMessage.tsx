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
      <div className={cn('text-[14px] text-black')}>
        {message.status === 'streaming' ? (
          <StreamingTypewriter
            streamingContent={message.streamingContent || ''}
            isStreaming={true}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content || message.streamingContent}
          </div>
        )}

        {/* 错误状态 */}
        {message.status === 'error' && (
          <div className="mt-2 text-sm text-red-500">发送失败，请重试</div>
        )}
      </div>
    </div>
  );
};
