'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import React, { memo } from 'react';

import { IChatMessage as ChatMessageType, IDraftData } from '@/types/draft';

interface ChatMessageProps {
  message: ChatMessageType;
  isThinking?: boolean;
  showDraftDisplay?: boolean;
}

// 草案展示组件
const DraftInfoDisplay: React.FC<{
  draft: IDraftData;
  isThinking?: boolean;
}> = ({ draft, isThinking }) => {
  const sections = [
    {
      emoji: '📝',
      title: 'Topic',
      content: draft.topic,
    },
    {
      emoji: '💬',
      title: 'Content Angel',
      content: draft.content_angle,
    },
    {
      emoji: '🔑',
      title: 'Key Points to Cover',
      content:
        draft.key_points?.map((string) => `• ${string}`).join('\n') || '',
    },
    {
      emoji: '👥',
      title: 'Target Audience',
      content: draft.target_audience,
    },
    {
      emoji: '🌐',
      title: 'Output Language',
      content: draft.output_language || 'Chinese',
    },
    {
      emoji: '🎯',
      title: 'Purpose',
      content: draft.purpose || '',
    },
    {
      emoji: '📏',
      title: 'Estimated Length',
      content: draft.content_length,
    },
    {
      emoji: '📊',
      title: 'Content Depth',
      content: draft.content_depth || '',
    },
    {
      emoji: '🔗',
      title: 'Add link as reference',
      content: draft.references?.length > 0 ? draft.references.join('\n') : '-',
    },
    {
      emoji: '📋',
      title: 'Special Requirements',
      content:
        draft.requirements?.length > 0
          ? draft.requirements.map((req) => `• ${req}`).join('\n')
          : '-',
    },
  ];

  return (
    <div className="space-y-0">
      {sections.map((section, index) => (
        <div key={index} className="flex gap-2.5 px-12 py-3">
          <div className="flex w-[400px] shrink-0 items-start gap-0">
            <span className="mr-1 text-base">{section.emoji}</span>
            <h3 className="font-poppins text-[16px] font-medium text-black">
              {section.title}
            </h3>
          </div>
          <div className="flex flex-1 items-center">
            <p className="font-poppins whitespace-pre-line text-[16px] font-[400] text-black">
              {isThinking && index === 0 ? (
                <span className="text-[#8C8C8C]">Generating...</span>
              ) : (
                section.content
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChatMessage = memo<ChatMessageProps>(
  ({ message, isThinking = false, showDraftDisplay = false }) => {
    const isUser = message.type === 'user';
    const isError = message.status === 'error';

    // 思考动画组件
    const ThinkingIndicator = () => (
      <div className="space-y-2">
        <div
          className="h-4 animate-pulse rounded bg-gray-200"
          style={{ width: '60%' }}
        ></div>
        <div
          className="h-4 animate-pulse rounded bg-gray-200"
          style={{ width: '80%' }}
        ></div>
        <div
          className="h-4 animate-pulse rounded bg-gray-200"
          style={{ width: '45%' }}
        ></div>
      </div>
    );

    // 如果是用户消息
    if (isUser) {
      return (
        <div className="mb-6 flex justify-end">
          <div className="font-poppins max-w-[635px] rounded-xl bg-[#F8F8F8] p-3 text-base font-normal text-black">
            {message.content}
          </div>
        </div>
      );
    }

    // AI消息 - 显示草案信息
    if (
      showDraftDisplay &&
      message.metadata?.draftUpdated &&
      message.metadata?.draftSnapshot
    ) {
      const draftToDisplay = message.metadata.draftSnapshot;

      // 判断是否是更新后的草案（基于消息索引或其他逻辑）
      const isUpdatedDraft =
        message.content && message.content.includes('new overview');

      return (
        <div className="mb-6">
          <div className="mb-3">
            {isUpdatedDraft ? (
              <p className="font-poppins mb-3 text-xl font-semibold text-black">
                Here is your new overview of the post to be generated.
              </p>
            ) : (
              <>
                <div className="font-sans text-black">
                  <span className="tex-[20px] font-[600]">
                    Let's Confirm Your Writing Intent
                  </span>
                  <br />
                  <span className="tex-[16px]">
                    Here's a quick overview of how we plan to structure your
                    article based on your topic:
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="my-3">
            <DraftInfoDisplay draft={draftToDisplay} isThinking={isThinking} />
          </div>

          <div className="mt-8">
            <p className="font-poppins text-[20px] font-medium text-black">
              If you're happy with it, type OK to continue. If not, feel free to
              tell me what you'd like to change.
            </p>
          </div>
        </div>
      );
    }

    // AI消息 - 普通消息
    return (
      <div className="mb-6">
        {isError && (
          <ExclamationCircleIcon className="mr-1 inline-block size-4 text-red-600" />
        )}

        {isThinking && !message.content ? (
          <div className="rounded-xl bg-[#F8F8F8] p-3">
            <ThinkingIndicator />
          </div>
        ) : (
          <div className="font-sans text-base font-normal text-black">
            {message.content}
          </div>
        )}
      </div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

// 消息列表组件
interface ChatMessageListProps {
  messages: ChatMessageType[];
  isThinking?: boolean;
  className?: string;
  latestMessageRef?: React.RefObject<HTMLDivElement>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isThinking = false,
  className = '',
  latestMessageRef,
}) => {
  return (
    <div className={`${className}`}>
      {messages.map((message, index) => {
        // 判断是否需要显示草案信息
        const showDraftDisplay =
          message.type === 'assistant' &&
          message.metadata?.draftUpdated &&
          message.metadata?.draftSnapshot !== undefined;
        
        // 判断是否是最新消息
        const isLatestMessage = index === messages.length - 1;

        return (
          <div 
            key={message.id} 
            ref={isLatestMessage ? latestMessageRef : undefined}
          >
            <ChatMessage
              message={message}
              showDraftDisplay={showDraftDisplay}
            />
          </div>
        );
      })}

      {/* 显示思考状态 */}
      {isThinking &&
        messages.length > 0 &&
        messages[messages.length - 1].type === 'user' && (
          <ChatMessage
            message={{
              id: 'thinking',
              type: 'assistant',
              content: '',
              timestamp: new Date(),
              status: 'sent',
            }}
            isThinking={true}
          />
        )}
    </div>
  );
};
