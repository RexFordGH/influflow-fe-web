'use client';

import { useEffect, useRef } from 'react';

import type { ChatMessage } from '@/types/agent-chat';

import { AIMessage } from './AIMessage';
import { UserMessage } from './UserMessage';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'user') {
      return <UserMessage key={message.id} message={message} />;
    }
    return (
      <AIMessage key={message.id} message={message} isStreaming={isStreaming} />
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-400">
          {/* <div className="text-center">
            <p className="mb-2 text-lg">开始对话</p>
            <p className="text-sm">输入您的问题或编辑需求</p>
          </div> */}
        </div>
      ) : (
        <>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
