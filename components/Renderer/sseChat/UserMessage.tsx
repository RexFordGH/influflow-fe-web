'use client';

import { Button, cn, Tooltip } from '@heroui/react';

import type { ChatMessage } from '@/types/agent-chat';
import { copyTwitterContent } from '@/utils/twitter';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="mb-6 flex w-full items-end justify-end">
      {/*复制按钮*/}
      <Tooltip
        content="Copy"
        showArrow={true}
        placement="top"
        color="foreground"
      >
        <Button
          size="sm"
          color="primary"
          variant="solid"
          onPress={async () => {
            await copyTwitterContent(message.content);
          }}
          className="h-[20px] min-w-10 rounded-lg p-0 hover:bg-[#fcfcfc]"
        >
          <img src="/icons/copy.svg" alt="copy" className="size-5" />
        </Button>
      </Tooltip>

      {/* 消息内容 */}
      <div
        className={cn(
          'p-[12px] rounded-lg max-w-[400px]',
          'bg-[#EFEFEF] text-black text-left rounded-[12px]',
        )}
      >
        <div className="break-all text-[14px]">{message.content}</div>

        {/* 错误状态 */}
        {message.status === 'error' && (
          <div className="mt-2 text-sm text-red-500">发送失败，请重试</div>
        )}
      </div>
    </div>
  );
};
