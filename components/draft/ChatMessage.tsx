'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import React, { memo } from 'react';

import { IChatMessage as ChatMessageType, IDraftData } from '@/types/draft';

interface ChatMessageProps {
  message: ChatMessageType;
  isThinking?: boolean;
  showDraftDisplay?: boolean;
  draft?: IDraftData | null;
}

// 草案展示组件
const DraftInfoDisplay: React.FC<{
  draft: IDraftData;
  isThinking?: boolean;
}> = ({ draft, isThinking }) => {
  const sections = [
    {
      emoji: '💬',
      title: 'Main Point of View',
      content: draft.content_angle,
    },
    {
      emoji: '🔑',
      title: 'Key Points to Cover',
      content:
        draft.key_points?.map((string) => `• ${string}`).join('\n') || '',
    },
    {
      emoji: '📏',
      title: 'Estimated Length',
      content: draft.content_length,
    },
    {
      emoji: '✍️',
      title: 'Tone & Style',
      content: `${draft.purpose || ''} - ${draft.content_depth || ''}`,
    },
    {
      emoji: '🔗',
      title: 'Add link to improve accuracy?',
      content:
        draft.references?.length > 0
          ? draft.references.join('\n')
          : "You can add any reference articles or links that reflect your style or include specific facts you'd like us to use.",
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="flex gap-10">
          <div className="flex w-[400px] items-start gap-2">
            <span className="text-xl">{section.emoji}</span>
            <h3
              className="text-xl font-medium"
              style={{ fontFamily: 'Poppins' }}
            >
              {section.title}
            </h3>
          </div>
          <div className="flex-1">
            <p
              className="whitespace-pre-line text-base text-black"
              style={{ fontFamily: 'Poppins' }}
            >
              {isThinking && index === 0 ? (
                <span className="text-gray-400">Generating...</span>
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
  ({ message, isThinking = false, showDraftDisplay = false, draft }) => {
    const isUser = message.type === 'user';
    const isError = message.status === 'error';
    const isSending = message.status === 'sending';

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
          <div className="font-poppins max-w-[60%] overflow-auto rounded-xl bg-[#F8F8F8] p-3 text-base text-black">
            {message.content}
          </div>
        </div>
      );
    }

    // AI消息 - 显示草案信息
    if (showDraftDisplay && draft && message.metadata?.draftUpdated) {
      // 判断是否是更新后的草案（基于消息索引或其他逻辑）
      const isUpdatedDraft =
        message.content && message.content.includes('new overview');

      return (
        <div className="mb-6">
          <div className="mb-4">
            {isUpdatedDraft ? (
              <p
                className="mb-4 text-base text-black"
                style={{ fontFamily: 'Arial' }}
              >
                Here is your new overview of the post to be generated.
              </p>
            ) : (
              <>
                <h2
                  className="mb-1 text-xl font-medium"
                  style={{ fontFamily: 'Arial' }}
                >
                  Let's Confirm Your Writing Intent
                </h2>
                <p
                  className="text-base text-black"
                  style={{ fontFamily: 'Arial' }}
                >
                  Here's a quick overview of how we plan to structure your
                  article based on your topic:
                </p>
              </>
            )}
          </div>

          <div className="py-3">
            <DraftInfoDisplay draft={draft} isThinking={isThinking} />
          </div>

          <div className="mt-8">
            <p
              className="text-xl font-medium"
              style={{ fontFamily: 'Poppins' }}
            >
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
          <div className="rounded-xl bg-gray-50 p-3">
            <ThinkingIndicator />
          </div>
        ) : (
          <div className="text-base text-black" style={{ fontFamily: 'Arial' }}>
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
  draft?: IDraftData | null;
  className?: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isThinking = false,
  draft,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      {messages.map((message, index) => {
        // 判断是否需要显示草案信息
        const showDraftDisplay =
          message.type === 'assistant' &&
          message.metadata?.draftUpdated &&
          draft !== null;

        return (
          <ChatMessage
            key={message.id}
            message={message}
            showDraftDisplay={showDraftDisplay}
            draft={draft}
          />
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
