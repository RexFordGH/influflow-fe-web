import { useDraftConfirmationContext } from '@/contexts/DraftConfirmationContext';
import { useCallback, useEffect, useMemo } from 'react';

/**
 * 自定义 Hook 用于草案确认功能
 * 提供更简便的接口来使用草案确认功能
 */
export const useDraftConfirmation = () => {
  const context = useDraftConfirmationContext();
  const {
    state,
    generateDraft,
    optimizeDraft,
    addMessage,
    clearState,
    confirmDraft,
    skipDraft,
    generateTwitterContent,
  } = context;

  // 判断是否可以发送消息
  const canSendMessage = useMemo(() => {
    return !state.isLoading && !state.isThinking;
  }, [state.isLoading, state.isThinking]);

  // 判断是否已准备好进行确认
  const isReadyToConfirm = useMemo(() => {
    return state.draft !== null && !state.isConfirmed;
  }, [state.draft, state.isConfirmed]);

  // 发送消息（智能判断是生成还是优化）
  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!canSendMessage) return;

      if (!state.session_id) {
        // 如果没有 session_id
        await generateDraft(userInput);
      } else {
        // 如果有 session_id，说明是优化草案
        await optimizeDraft(userInput);
      }
    },
    [canSendMessage, state.session_id, generateDraft, optimizeDraft],
  );

  // 获取最新的草案信息
  const latestDraft = useMemo(() => {
    return state.draft;
  }, [state.draft]);

  // 获取对话历史
  const chatHistory = useMemo(() => {
    return state.messages;
  }, [state.messages]);

  // 获取最后一条消息
  const lastMessage = useMemo(() => {
    return state.messages[state.messages.length - 1] || null;
  }, [state.messages]);

  // 检查是否正在等待用户确认
  const isWaitingForConfirmation = useMemo(() => {
    return state.draft !== null && !state.isConfirmed && !state.isLoading;
  }, [state.draft, state.isConfirmed, state.isLoading]);

  // 清理函数，组件卸载时调用
  useEffect(() => {
    return () => {
      // 组件卸载时可以选择是否清空状态
      // clearState();
    };
  }, []);

  // 错误处理辅助函数
  const hasError = useMemo(() => {
    return state.error !== null;
  }, [state.error]);

  // 获取错误信息
  const errorMessage = useMemo(() => {
    return state.error;
  }, [state.error]);

  // 重试函数
  const retry = useCallback(async () => {
    if (lastMessage && lastMessage.type === 'user') {
      await sendMessage(lastMessage.content);
    }
  }, [lastMessage, sendMessage]);

  // 性能监控
  const getPerformanceMetrics = useCallback(() => {
    return {
      totalMessages: state.messages.length,
      userMessages: state.messages.filter((m) => m.type === 'user').length,
      assistantMessages: state.messages.filter((m) => m.type === 'assistant')
        .length,
      hasError: hasError,
      isConfirmed: state.isConfirmed,
    };
  }, [state.messages, hasError, state.isConfirmed]);

  return {
    // 状态
    draft: latestDraft,
    session_id: state.session_id,
    messages: chatHistory,
    isLoading: state.isLoading,
    isThinking: state.isThinking,
    isConfirmed: state.isConfirmed,
    requires_review: state.requires_review,
    error: errorMessage,

    // 计算属性
    canSendMessage,
    isReadyToConfirm,
    isWaitingForConfirmation,
    hasError,
    lastMessage,

    // 方法
    sendMessage,
    confirmDraft,
    skipDraft,
    clearState,
    retry,
    getPerformanceMetrics,

    // 原始方法（如果需要更细粒度的控制）
    generateDraft,
    optimizeDraft,
    addMessage,
    generateTwitterContent,
  };
};
