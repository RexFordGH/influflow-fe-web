'use client';

import { cn } from '@heroui/react';

import type { ChatMessage } from '@/types/agent-chat';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="mb-6 flex justify-end">
      {/* 消息内容 */}
      <div className={cn('p-[12px] rounded-lg', 'bg-[#EFEFEF] text-black')}>
        <div className="whitespace-pre-wrap break-words text-[14px]">
          {message.content}
        </div>

        {/* 错误状态 */}
        {message.status === 'error' && (
          <div className="mt-2 text-sm text-red-500">发送失败，请重试</div>
        )}
      </div>
    </div>
  );
};
