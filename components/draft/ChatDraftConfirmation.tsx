'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { DraftConfirmationProvider } from '@/contexts/DraftConfirmationContext';
import { useDraftConfirmation } from '@/hooks/useDraftConfirmation';
import { IContentFormat, IMode } from '@/types/api';

import { addToast } from '../base/toast';

import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessage';
import { ConfirmDialog, DialogType } from './ConfirmDialog';

interface ChatDraftConfirmationProps {
  topic: string;
  contentFormat: IContentFormat;
  mode?: IMode; // 添加mode属性，支持未来扩展
  onBack: () => void;
  onConfirm: (
    topic: string,
    contentFormat: IContentFormat,
    mode?: IMode,
    sessionId?: string,
  ) => void;
  onSkip?: () => void;
  initialData?: any;
  className?: string;
}

// 内部组件，使用 Context
const ChatDraftConfirmationInner: React.FC<ChatDraftConfirmationProps> = ({
  topic,
  contentFormat,
  mode,
  onBack,
  onConfirm,
  className = '',
}) => {
  const {
    session_id,
    messages,
    isLoading,
    isThinking,
    isConfirmed,
    hasError,
    error,
    canSendMessage,
    sendMessage,
    generateDraft,
    clearState,
  } = useDraftConfirmation();

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('exit');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null!);
  const hasInitialized = useRef(false);

  // 滚动到最新消息
  const scrollToLatestMessage = useCallback(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // 滚动到消息的顶部位置
      });
    }
  }, []);

  // 初始化生成草案
  useEffect(() => {
    if (!hasInitialized.current && topic) {
      hasInitialized.current = true;
      generateDraft(topic);
    }
  }, [topic, generateDraft]);

  // 消息更新时滚动到最新消息
  useEffect(() => {
    // 只在有新消息时滚动
    if (messages.length > 0) {
      scrollToLatestMessage();
    }
  }, [messages, scrollToLatestMessage]);

  // 确认完成后跳转
  useEffect(() => {
    if (isConfirmed && !isLoading) {
      onConfirm(topic, contentFormat, mode || 'draft', session_id || undefined);
    }
  }, [
    isConfirmed,
    isLoading,
    topic,
    contentFormat,
    mode,
    onConfirm,
    session_id,
  ]);

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
      // SKIP 改为等同于输入 "ok" 确认草稿
      sendMessage('ok');
      setShowDialog(false);
    }
  }, [dialogType, clearState, onBack, sendMessage]);

  // 处理发送消息
  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  return (
    <div className={`flex h-screen flex-col bg-white ${className}`}>
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between gap-[38px] bg-white px-20 py-[24px]">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleBack}
          aria-label="Back"
          className="size-6 min-w-[24px] p-0"
          isDisabled={isLoading || isThinking}
        >
          <ArrowLeftIcon className="size-6 text-black" />
        </Button>

        <button
          onClick={handleSkip}
          disabled={isLoading || isThinking}
          className={`font-poppins rounded-[20px] py-1 text-base font-medium transition-colors ${
            isLoading || isThinking
              ? 'cursor-not-allowed text-gray-300'
              : 'text-[#8C8C8C] hover:opacity-80'
          }`}
        >
          SKIP
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden px-20">
        {/* 聊天内容区域 */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* 初始欢迎信息 或 消息列表 */}
          {messages.length === 0 && !isLoading ? (
            <div className="flex justify-end">
              <div className="font-poppins inline-block max-w-[635px] rounded-xl bg-[#F8F8F8] p-3 text-base font-normal text-black">
                {topic}
              </div>
            </div>
          ) : (
            <ChatMessageList
              messages={messages}
              isThinking={isThinking}
              className="mx-auto max-w-6xl"
              latestMessageRef={latestMessageRef}
            />
          )}

          {/* 滚动到底部的锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框区域 */}
        <div className="py-6">
          <ChatInput
            onSend={handleSendMessage}
            disabled={!canSendMessage || isConfirmed}
            placeholder={
              isConfirmed
                ? 'Draft confirmed, generating content...'
                : 'Tell me more about the details'
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
