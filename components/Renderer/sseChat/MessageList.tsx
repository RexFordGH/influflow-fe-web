'use client';

import { useEffect, useRef } from 'react';

import type { ChatMessage } from '@/types/agent-chat';

import { AIMessage } from './AIMessage';
import { AIMessageWithTransition } from './AIMessageWithTransition';
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

  // 只在有新消息时滚动到底部（不干扰向上加载）
  useEffect(() => {
    // 只在流式输出或有新用户消息时滚动
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && (lastMessage.type === 'user' || isStreaming)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // 使用过渡效果的开关（可以通过环境变量或配置控制）
  const useTransitionEffect = false;

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'user') {
      return <UserMessage key={message.id} message={message} />;
    }

    // 根据开关选择使用哪个组件
    const AIMessageComponent = useTransitionEffect
      ? AIMessageWithTransition
      : AIMessage;

    return (
      <AIMessageComponent
        key={message.id}
        message={message}
        isStreaming={isStreaming}
      />
    );
  };

  return (
    <div className="p-4">
      {messages.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center">
          {/* <div className="text-center">
            <p className="mb-1 text-sm text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300">Start a conversation below</p>
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
