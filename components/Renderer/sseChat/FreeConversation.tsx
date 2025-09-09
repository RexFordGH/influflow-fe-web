'use client';

import { cn, Image } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatStreaming } from '@/hooks/useChatStreaming';
import {
  useGetChatHistory,
  type IChatHistoryMessage,
  type IChatHistoryParams,
} from '@/lib/api/services';
import { saveOutlineToSupabase } from '@/services/supabase-save';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { ChatMessage } from '@/types/agent-chat';
import type { IOutline } from '@/types/outline';

import { ChatDialog } from './ChatDialog';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';
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

  // 获取积分检查方法和刷新方法
  const { checkCreditsAndShowModal, refreshSubscriptionInfo } =
    useSubscriptionStore();

  // 使用 ref 跟踪上一个 docId
  const prevDocIdRef = useRef<string>(docId);
  const hasLoadedHistoryRef = useRef(false);
  const hasSetInitialHistoryRef = useRef(false); // 添加标记，防止重复设置历史消息

  // 分页状态
  const [offset, setOffset] = useState(0);
  const [allHistoryMessages, setAllHistoryMessages] = useState<
    IChatHistoryMessage[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 使用 IntersectionObserver 的 refs
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // 分页获取历史记录
  const historyParams: IChatHistoryParams = {
    docId,
    offset,
    limit: 20,
    order: 'desc',
    enabled: isOpen && !isLoadingMore,
  };

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useGetChatHistory(historyParams);

  // 包装 onComplete 回调，在完成后刷新订阅信息
  const handleComplete = useCallback(
    async (outline: any) => {
      // 调用原始的 onComplete
      onComplete?.(outline);
      // 刷新订阅信息以更新积分
      await refreshSubscriptionInfo();
    },
    [onComplete, refreshSubscriptionInfo],
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
    onComplete: handleComplete,
  });

  // 处理发送消息
  const handleSendMessage = useCallback(
    async (message: string) => {
      // 检查积分是否足够
      if (!checkCreditsAndShowModal()) {
        return;
      }
      await sendMessage(message);
    },
    [sendMessage, checkCreditsAndShowModal],
  );

  // 检测 docId 变化并重置状态
  useEffect(() => {
    // 如果 docId 发生变化
    if (prevDocIdRef.current !== docId) {
      // 清理所有状态
      clearMessages();
      setAllHistoryMessages([]);
      setOffset(0);
      setHasMore(true);
      setIsLoadingMore(false); // 重要：重置加载状态，确保新文章能触发接口
      hasLoadedHistoryRef.current = false;
      hasSetInitialHistoryRef.current = false; // 重置初始历史标记
      prevDocIdRef.current = docId;
    }
  }, [docId, clearMessages]);

  // 处理历史记录加载
  useEffect(() => {
    // 如果有错误，停止loading并标记为已加载
    if (historyError) {
      setIsLoadingMore(false);
      setHasMore(false);
      hasLoadedHistoryRef.current = true;
      console.error('Failed to load chat history:', historyError);
      return;
    }

    if (!historyData || isLoadingHistory) return;

    const { messages: newMessages = [], has_more: moreAvailable = false } =
      historyData;

    if (newMessages.length > 0) {
      // 保存当前滚动位置
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;
      const previousScrollTop = container?.scrollTop || 0;

      // 累加历史消息（反向添加，因为是向上加载）
      setAllHistoryMessages((prev) => [...newMessages, ...prev]);
      setHasMore(moreAvailable);

      // 使用 requestAnimationFrame 保持滚动位置
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - previousScrollHeight;
          container.scrollTop = previousScrollTop + scrollDiff;
        }
      });
    } else {
      setHasMore(false);
    }

    setIsLoadingMore(false);
    hasLoadedHistoryRef.current = true;
  }, [historyData, isLoadingHistory, historyError]);

  // 将历史消息转换为 ChatMessage 格式并设置到消息列表
  useEffect(() => {
    if (!isOpen || allHistoryMessages.length === 0) return;

    // 只在初次加载且没有设置过历史时设置消息
    if (hasSetInitialHistoryRef.current && offset === 0) return;

    const formattedHistory: ChatMessage[] = allHistoryMessages.map(
      (msg: IChatHistoryMessage, index) => ({
        // 使用稳定的 ID，避免重新生成导致重复
        id: `history-${msg.type}-${index}-${msg.content.substring(0, 10)}`,
        type: msg.type === 'human' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(),
        status: 'complete' as const,
      }),
    );

    // 反转数组，因为 API 返回的是倒序
    const reversedHistory = formattedHistory.reverse();

    if (!hasSetInitialHistoryRef.current) {
      // 第一次加载：直接设置历史消息
      setMessages(reversedHistory);
      hasSetInitialHistoryRef.current = true;

      // 首次加载历史记录后，自动滚动到底部
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    } else if (offset > 0) {
      // 分页加载更多：只添加新的历史消息到开头
      setMessages((prev) => {
        // 过滤掉可能的重复消息（基于ID）
        const existingIds = new Set(prev.map((m) => m.id));
        const newHistoryMessages = reversedHistory.filter(
          (m) => !existingIds.has(m.id),
        );

        // 将新的历史消息添加到开头
        return [...newHistoryMessages, ...prev];
      });
    }
  }, [allHistoryMessages, isOpen, setMessages, offset]);

  // 加载更多历史消息
  const loadMoreHistory = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoadingHistory) return;

    // 防止在切换文章过程中触发加载
    if (prevDocIdRef.current !== docId) return;

    setIsLoadingMore(true);
    setOffset((prev) => prev + 20);
  }, [isLoadingMore, hasMore, isLoadingHistory, docId]);

  // 对话框打开时自动滚动到底部
  useEffect(() => {
    if (isOpen && messages.length > 0 && !isLoadingHistory) {
      // 使用 setTimeout 确保 DOM 已经更新
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }, [isOpen, messages.length, isLoadingHistory]);

  // 使用 IntersectionObserver 监听加载触发器
  useEffect(() => {
    if (!isOpen || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // 当加载触发器进入视口时加载更多
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreHistory();
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '100px', // 提前100px触发加载
        threshold: 0.1,
      },
    );

    const triggerElement = loadMoreTriggerRef.current;
    if (triggerElement) {
      observer.observe(triggerElement);
    }

    return () => {
      if (triggerElement) {
        observer.unobserve(triggerElement);
      }
      observer.disconnect();
    };
  }, [isOpen, hasMore, isLoadingMore, loadMoreHistory]);

  // 处理关闭对话框
  const handleClose = useCallback(() => {
    setIsOpen(false);
    // 关闭对话框时重置加载状态，避免重新打开时被阻塞
    setIsLoadingMore(false);
    // 保持消息状态，这样重新打开时不会重新加载历史
  }, [setIsOpen]);

  // 监听来自ArticleToolbar的关闭事件
  useEffect(() => {
    const handler = () => {
      handleClose();
    };
    window.addEventListener('closeChatDialog', handler as EventListener);
    return () =>
      window.removeEventListener('closeChatDialog', handler as EventListener);
  }, [handleClose]);

  return (
    <>
      {/* 触发按钮 */}
      <div className="fixed bottom-6 left-0 z-40 flex w-1/2 justify-center">
        <button
          onClick={() => {
            setIsOpen(true);
            // 触发mindmapOverlayState事件，将isMindmapOverlayOpen设置为true
            window.dispatchEvent(
              new CustomEvent('mindmapOverlayState', {
                detail: { open: true },
              }),
            );
          }}
          className={cn(
            'flex items-center justify-between gap-[10px]',
            'h-[40px]',
            'p-[12px] pr-0',
            'bg-white',
            'rounded-[20px]',
            'shadow-[0_0_12px_rgba(68,138,255,0.15)]',
            'transition-all duration-200',
            'hover:shadow-[0_0_16px_rgba(68,138,255,0.25)]',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(68,138,255)] focus:ring-offset-2',
          )}
          style={{ width: '600px' }}
        >
          <span className="font-poppins text-[13px] text-[#8C8C8C]">
            How would you like to improve this content?
          </span>
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
        {/* 消息列表容器 */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
          {/* IntersectionObserver 触发器 - 哨兵元素 */}
          {hasMore && !historyError && (
            <div ref={loadMoreTriggerRef} className="py-3">
              {isLoadingMore || (isLoadingHistory && offset > 0) ? (
                <LoadingIndicator
                  text="Loading earlier messages..."
                  size="sm"
                />
              ) : null}
            </div>
          )}

          {/* 加载历史记录错误提示 */}
          {/* {historyError && offset > 0 && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-red-400">Failed to load messages</span>
            </div>
          )} */}

          {/* 初次加载指示器或错误提示 */}
          {offset === 0 && messages.length === 0 && (
            <div className="flex min-h-[200px] items-center justify-center">
              {historyError ? (
                <div className="text-center">
                  {/* <p className="mb-1 text-sm text-red-400">
                    Failed to load history
                  </p> */}
                  <p className="text-xs text-gray-400">
                    Start a new conversation below
                  </p>
                </div>
              ) : isLoadingHistory ? (
                <LoadingIndicator
                  text="Loading conversation history..."
                  size="sm"
                />
              ) : null}
            </div>
          )}

          {/* 消息列表 */}
          <MessageList messages={messages} isStreaming={isStreaming} />
        </div>

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
