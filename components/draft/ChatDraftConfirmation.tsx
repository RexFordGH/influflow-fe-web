'use client';

import { DraftConfirmationProvider } from '@/contexts/DraftConfirmationContext';
import { useDraftConfirmation } from '@/hooks/useDraftConfirmation';
import { ContentFormat } from '@/types/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addToast } from '../base/toast';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessage';
import { ConfirmDialog, DialogType } from './ConfirmDialog';

interface ChatDraftConfirmationProps {
  topic: string;
  contentFormat: ContentFormat;
  onBack: () => void;
  onConfirm: (topic: string, contentFormat: ContentFormat) => void;
  onSkip?: () => void;
  initialData?: any;
  className?: string;
}

// 内部组件，使用 Context
const ChatDraftConfirmationInner: React.FC<ChatDraftConfirmationProps> = ({
  topic,
  contentFormat,
  onBack,
  onConfirm,
  onSkip,
  className = '',
}) => {
  const {
    draft,
    messages,
    isLoading,
    isThinking,
    isConfirmed,
    hasError,
    error,
    canSendMessage,
    sendMessage,
    skipDraft,
    generateDraft,
    clearState,
  } = useDraftConfirmation();

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('exit');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 初始化生成草案
  useEffect(() => {
    if (!hasInitialized.current && topic) {
      hasInitialized.current = true;
      generateDraft(topic);
    }
  }, [topic, generateDraft]);

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 确认完成后跳转
  useEffect(() => {
    if (isConfirmed && !isLoading) {
      // 延迟一点时间让用户看到确认消息
      setTimeout(() => {
        onConfirm(topic, contentFormat);
      }, 1000);
    }
  }, [isConfirmed, isLoading, topic, contentFormat, onConfirm]);

  // 错误提示
  useEffect(() => {
    if (hasError && error) {
      addToast({
        title: error,
        color: 'danger',
      });
    }
  }, [hasError, error]);

  // 处理返回
  const handleBack = useCallback(() => {
    setDialogType('exit');
    setShowDialog(true);
  }, []);

  // 处理跳过
  const handleSkip = useCallback(() => {
    setDialogType('skip');
    setShowDialog(true);
  }, []);

  // 确认对话框处理
  const handleDialogConfirm = useCallback(() => {
    if (dialogType === 'exit') {
      clearState();
      onBack();
    } else if (dialogType === 'skip') {
      skipDraft();
      if (onSkip) {
        onSkip();
      } else {
        // 如果没有提供 onSkip，则直接调用 onConfirm
        setTimeout(() => {
          onConfirm(topic, contentFormat);
        }, 500);
      }
    }
  }, [
    dialogType,
    clearState,
    onBack,
    skipDraft,
    onSkip,
    onConfirm,
    topic,
    contentFormat,
  ]);

  // 处理发送消息
  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  return (
    <div className={`flex flex-col h-screen bg-white ${className}`}>
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-20 py-14 bg-white">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleBack}
          aria-label="返回"
          className="p-0 min-w-6 h-6"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </Button>

        <button
          onClick={handleSkip}
          className="text-[#8C8C8C] text-base font-medium hover:text-gray-700 transition-colors"
          style={{ fontFamily: 'Poppins' }}
        >
          SKIP
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden px-20">
        {/* 聊天内容区域 */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* 初始欢迎信息 或 消息列表 */}
          {messages.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <div className="text-[#8C8C8C] text-base bg-[#F8F8F8] rounded-xl px-3 py-3 inline-block mb-6"
                   style={{ fontFamily: 'Poppins' }}>
                {topic}
              </div>
            </div>
          ) : (
            <ChatMessageList
              messages={messages}
              isThinking={isThinking}
              draft={draft}
              className="max-w-6xl mx-auto"
            />
          )}
          
          {/* 滚动到底部的锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框区域 */}
        <div className="border-t pt-6 pb-6">
          <ChatInput
            onSend={handleSendMessage}
            disabled={!canSendMessage || isConfirmed}
            placeholder={
              isConfirmed
                ? '草案已确认，正在生成内容...'
                : 'Tell me more about the details,'
            }
          />
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDialogConfirm}
        type={dialogType}
      />
    </div>
  );
};

// 导出包装后的组件
export const ChatDraftConfirmation: React.FC<ChatDraftConfirmationProps> = (
  props,
) => {
  return (
    <DraftConfirmationProvider>
      <ChatDraftConfirmationInner {...props} />
    </DraftConfirmationProvider>
  );
};
