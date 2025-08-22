'use client';

import { cn, Image } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatStreaming } from '@/hooks/useChatStreaming';
import { getChatHistory, type IChatHistoryMessage } from '@/lib/api/services';
import { saveOutlineToSupabase } from '@/services/supabase-save';
import type { ChatMessage } from '@/types/agent-chat';
import type { IOutline } from '@/types/outline';

import { ChatDialog } from './ChatDialog';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

interface FreeConversationProps {
  docId?: string;
  documentContext?: IOutline;
  onContentUpdate?: (updatedData: IOutline) => void;
  onDataUpdate?: () => void; // 添加数据更新回调
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FreeConversation({
  docId = 'default',
  documentContext,
  onContentUpdate,
  onDataUpdate,
  isOpen: isOpenProp = false,
  onOpenChange,
}: FreeConversationProps) {
  // 使用内部状态或外部控制
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenProp || isOpenInternal;

  // 使用 ref 跟踪上一个 docId
  const prevDocIdRef = useRef<string>(docId);
  const hasLoadedHistoryRef = useRef(false);

  const setIsOpen = useCallback(
    (open: boolean) => {
      setIsOpenInternal(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const onComplete = async (outline: IOutline) => {
    console.log('useChatStreaming onComplete', outline, messages);
    // 创建新对象确保触发React重新渲染
    const updatedOutline = {
      ...outline,
      id: docId,
      updatedAt: Date.now(), // 添加时间戳确保对象唯一性
    };

    // 先更新本地状态
    onContentUpdate?.(updatedOutline);

    // 然后保存到 Supabase
    await saveOutlineToSupabase(
      updatedOutline,
      () => {
        // 成功保存后，触发侧边栏数据刷新
        onDataUpdate?.();
        console.log('Free conversation content saved to Supabase');
      },
      (error) => {
        console.error('Failed to save free conversation content:', error);
      },
    );
  };

  // 只在 docId 变化且打开时获取历史记录
  const shouldFetchHistory =
    isOpen && (prevDocIdRef.current !== docId || !hasLoadedHistoryRef.current);
  const { data: historyMessages, isLoading: isLoadingHistory } = getChatHistory(
    docId,
    shouldFetchHistory,
  );

  // 使用 useChatStreaming Hook
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  } = useChatStreaming({
    docId,
    onError: (error) => {
      console.error('对话错误:', error);
    },
    onComplete: onComplete,
  });

  // 处理发送消息
  const handleSendMessage = useCallback(
    async (message: string) => {
      await sendMessage(message);
    },
    [sendMessage],
  );

  // 检测 docId 变化并处理历史记录
  useEffect(() => {
    // 如果 docId 发生变化
    if (prevDocIdRef.current !== docId) {
      // 清理之前的消息
      clearMessages();
      // 重置加载标记
      hasLoadedHistoryRef.current = false;
      // 更新 ref
      prevDocIdRef.current = docId;
    }
  }, [docId, clearMessages]);

  // 加载历史记录
  useEffect(() => {
    if (!shouldFetchHistory || isLoadingHistory || hasLoadedHistoryRef.current)
      return;

    if (historyMessages && historyMessages.length > 0) {
      // 将历史记录转换为 ChatMessage 格式
      const formattedHistory: ChatMessage[] = historyMessages.map(
        (msg: IChatHistoryMessage) => ({
          id: crypto.randomUUID(),
          type: msg.type === 'human' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(),
          status: 'complete' as const,
        }),
      );

      // 设置历史消息
      setMessages(formattedHistory);
      // 标记已加载
      hasLoadedHistoryRef.current = true;
    } else if (historyMessages !== undefined) {
      // 如果已经获取到数据（无论是空数组还是有数据），都标记为已加载
      hasLoadedHistoryRef.current = true;
    }
  }, [shouldFetchHistory, historyMessages, isLoadingHistory, setMessages]);

  // 处理关闭对话框
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <>
      {/* 触发按钮 */}
      <div className="fixed bottom-6 left-0 z-40 flex w-1/2 justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center justify-between gap-[10px]',
            'h-[40px]',
            'p-[12px] pr-0',
            'text-[#8C8C8C] font-[14px] font-poppins',
            'bg-white',
            'rounded-[20px]',
            'shadow-[0_0_12px_rgba(68,138,255,0.15)]',
            'transition-all duration-200',
            'hover:shadow-[0_0_16px_rgba(68,138,255,0.25)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(68,138,255)] focus:ring-offset-2',
          )}
        >
          <span>Chat to edit the content</span>
          <Image
            src="/icons/send.svg"
            alt="发送"
            width={40}
            height={40}
            className="pointer-events-none"
          />
        </button>
      </div>

      {/* 对话界面 */}
      <ChatDialog isOpen={isOpen} onClose={handleClose}>
        {/* 加载历史记录时显示提示 */}
        {/* {isLoadingHistory && shouldFetchHistory && (
          <div className="flex justify-center p-4">
            <span className="text-sm text-gray-500">Loading Chat History...</span>
          </div>
        )} */}

        {/* 消息列表 */}
        <MessageList messages={messages} isStreaming={isStreaming} />

        {/* 错误提示 */}
        {error && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {/* 输入框 */}
        <div className="px-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
            placeholder="How would you like to improve this content?"
            maxLength={5000}
          />
        </div>
      </ChatDialog>
    </>
  );
}
