import { connectAgentChatStream, createAgentChat } from '@/lib/api/agent-chat';
import type {
  AgentChatEvent,
  AgentChatEventBase,
  ChatMessage,
  MessageDoneData,
  WriteDoneData,
} from '@/types/agent-chat';
import { devLog } from '@/utils/devLog';
import { processChatOutline } from '@/utils/outlineCompatibility';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatStreamingOptions {
  docId: string;
  onError?: (error: Error) => void;
  onComplete?: (outline: any) => void;
  maxRetry?: number;
  retryInterval?: number;
  enableTypewriter?: boolean; // 是否启用打字机效果
  typewriterSpeed?: number; // 打字机速度（毫秒/字符）
  initialMessages?: ChatMessage[]; // 初始消息列表
}

interface UseChatStreamingReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; // 暴露 setMessages
}

interface SSEController {
  abort: () => void;
  isFinished: () => boolean;
}

const ShowMessageAsTitle = false;

// 内容处理器 - 替换模式而非累积模式
class StreamContentProcessor {
  private currentContent: Map<string, { title?: string; text?: string; type?: string }> = new Map();

  // 设置内容（替换模式）
  set(
    messageId: string,
    content: string | { title?: string; text?: string },
    type: 'reasoning' | 'write' | 'message' | 'search' | 'general' = 'general',
  ): { title?: string; text?: string; type?: string } {
    if (!content) return this.get(messageId);

    const key = messageId;
    let processedContent: { title?: string; text?: string; type?: string } = { type };

    if (typeof content === 'object') {
      // 对象格式：包含标题和内容
      const { title, text } = content;
      
      if (title) {
        // 添加图标前缀
        switch (type) {
          case 'reasoning':
            processedContent.title = `🤔 ${title}`;
            break;
          case 'write':
            processedContent.title = `✍️ ${title}`;
            break;
          case 'search':
            processedContent.title = `🔍 ${title}`;
            break;
          default:
            processedContent.title = title;
        }
      }
      
      if (text) {
        processedContent.text = text;
      }
    } else {
      // 字符串格式：直接作为内容
      processedContent.text = content;
    }

    // 替换当前内容
    this.currentContent.set(key, processedContent);
    return processedContent;
  }

  // 获取当前内容
  get(messageId: string): { title?: string; text?: string; type?: string } {
    return this.currentContent.get(messageId) || {};
  }

  // 清除指定消息的内容
  clear(messageId: string): void {
    this.currentContent.delete(messageId);
  }

  // 清除所有内容
  clearAll(): void {
    this.currentContent.clear();
  }
}

export const useChatStreaming = ({
  docId,
  onError,
  onComplete,
  maxRetry = 3,
  retryInterval = 2000,
  enableTypewriter = true,
  typewriterSpeed = 20,
  initialMessages = [],
}: UseChatStreamingOptions): UseChatStreamingReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const sseControllerRef = useRef<SSEController | null>(null);
  const currentAiMessageId = useRef<string | null>(null);
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentProcessor = useRef(new StreamContentProcessor());

  // 创建聊天会话
  const createChatSession = async (userMessage: string): Promise<string> => {
    try {
      return await createAgentChat(docId, userMessage);
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  };

  // 更新消息内容的辅助函数（替换模式）
  const updateMessageContent = useCallback(
    (
      messageId: string,
      content: string | { title?: string; text?: string },
      type:
        | 'reasoning'
        | 'write'
        | 'message'
        | 'search'
        | 'general' = 'general',
      status: ChatMessage['status'] = 'streaming',
    ) => {
      const processedContent = contentProcessor.current.set(
        messageId,
        content,
        type,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                streamingTitle: processedContent.title,
                streamingContent: processedContent.text,
                streamingType: processedContent.type,
                status,
              }
            : msg,
        ),
      );

      return processedContent;
    },
    [],
  );

  // 处理 SSE 事件
  const handleSSEEvent = useCallback(
    (event: AgentChatEvent) => {
      const aiMessageId = currentAiMessageId.current;
      if (!aiMessageId) return;

      devLog('handleSSEEvent, aiMessageId + event', aiMessageId, event);

      // 根据事件类型更新消息
      switch (event.event_type) {
        case 'response.created':
          devLog('response.created', event);
          setIsConnected(true);
          break;

        case 'response.in_progress':
          devLog('response.in_progress', event);
          break;

        case 'reasoning.start':
          devLog('reasoning.start', event);
          const reasoningStartData = event as any;
          const step =
            reasoningStartData.data?.index !== undefined
              ? `Step ${reasoningStartData.data.index + 1}`
              : '';

          // message 作为标题，步骤信息作为内容
          updateMessageContent(
            aiMessageId,
            {
              title: event.message || 'Start thinking...',
              text: step,
            },
            'reasoning',
          );
          break;

        case 'reasoning.done':
          devLog('reasoning.done', event);
          const reasoningData = event as any;

          // 提取推理内容
          const reasoningText =
            reasoningData.data?.text || reasoningData.data?.data?.text || '';

          // message 作为标题，text 作为内容
          if (event.message || reasoningText) {
            updateMessageContent(
              aiMessageId,
              {
                title: event.message || 'Thinking done.',
                text: reasoningText,
              },
              'reasoning',
            );
          }
          break;

        case 'web_search.start':
          devLog('web_search.start', event);
          updateMessageContent(
            aiMessageId,
            { title: event.message || 'Start Web Searching...' },
            'search',
          );
          break;

        case 'web_search.done':
          devLog('web_search.done', event);
          const searchData = event as any;
          const searchResults =
            searchData.data?.results || searchData.data?.text || '';

          const resultsText =
            typeof searchResults === 'string'
              ? searchResults
              : searchResults.length
                ? `find ${searchResults.length} results`
                : '';

          updateMessageContent(
            aiMessageId,
            {
              title: event.message || 'Search done.',
              text: resultsText,
            },
            'search',
          );
          break;

        case 'message.start':
          devLog('message.start', event);
          setIsStreaming(true);
          setIsConnected(true);

          // 清除之前的打字机效果
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          // message 作为标题显示
          if (event.message) {
            updateMessageContent(
              aiMessageId,
              { title: event.message },
              'message',
            );
          }
          break;

        case 'message.done':
          const messageData = event as AgentChatEventBase<
            'message.done',
            MessageDoneData
          >;

          devLog('message.done', event);

          // 提取内容文本（不包括message字段，那是标题）
          const contentText =
            messageData.data?.text ||
            (messageData.data as any)?.data?.text ||
            (messageData.data as any)?.message ||
            '';

          if (!contentText && !messageData.message) {
            console.warn('message.done 没有提取到任何内容');
          }

          // 清除打字机效果
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          // message 作为标题，data中的内容作为文本
          if (messageData.message || contentText) {
            // 更新消息内容（替换模式）
            const processedContent = updateMessageContent(
              aiMessageId,
              {
                title: messageData.message || '',
                text: contentText,
              },
              'message',
            );

            if (enableTypewriter && contentText) {
              // 打字机效果
              let currentIndex = 0;
              const fullText = contentText;

              typewriterIntervalRef.current = setInterval(() => {
                if (currentIndex <= fullText.length) {
                  const displayText = fullText.slice(0, currentIndex);

                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== aiMessageId) return msg;

                      const isComplete = currentIndex === fullText.length;
                      return {
                        ...msg,
                        streamingTitle: processedContent.title,
                        streamingContent: displayText,
                        streamingType: processedContent.type,
                        status:
                          msg.status === 'complete'
                            ? 'complete'
                            : isComplete
                              ? 'complete'
                              : 'streaming',
                        content: isComplete ? fullText : msg.content || '',
                      };
                    }),
                  );

                  currentIndex++;
                } else {
                  // 打字机完成，清理
                  clearInterval(typewriterIntervalRef.current!);
                  typewriterIntervalRef.current = null;

                  // 确保最终状态正确
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: fullText,
                            streamingTitle: undefined,
                            streamingContent: undefined,
                            streamingType: undefined,
                            status: 'complete' as const,
                          }
                        : msg,
                    ),
                  );
                }
              }, typewriterSpeed);
            } else {
              // 直接显示内容
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? {
                        ...msg,
                        content: contentText,
                        streamingTitle: processedContent.title,
                        streamingContent: contentText,
                        streamingType: processedContent.type,
                        status: 'complete' as const,
                      }
                    : msg,
                ),
              );
            }
          }
          break;

        case 'write.start':
          devLog('write.start', event);
          updateMessageContent(
            aiMessageId,
            { title: event.message || 'Start generating content...' },
            'write',
          );
          break;

        case 'write.done':
          const writeData = event as AgentChatEventBase<
            'write.done',
            WriteDoneData
          >;
          devLog('write.done', event);

          // 提取各种可能的内容
          const writeText =
            (writeData.data as any)?.text ||
            (writeData.data as any)?.data?.text ||
            '';
          const writeOutline = writeData.data?.outline;

          if (event.message || writeText || writeOutline) {
            let contentText = writeText;

            if (writeOutline && !writeText) {
              contentText = `大纲主题: ${writeOutline.topic || '新内容'}\n节点数: ${writeOutline.nodes?.length || 0}`;
            }

            updateMessageContent(
              aiMessageId,
              {
                title: event.message || '内容生成完成',
                text: contentText,
              },
              'write',
            );

            // 同时更新outline字段
            if (writeOutline) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, outline: writeOutline as any }
                    : msg,
                ),
              );
            }
          }
          break;

        case 'chat.done':
          const chatData = event as AgentChatEventBase<
            'chat.done',
            WriteDoneData
          >;
          devLog('chat.done', event);

          if (event.message) {
            updateMessageContent(
              aiMessageId,
              { title: event.message },
              'general',
            );
          }

          // 不要立即清除 streamingContent，保持打字机效果的连续性
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.id !== aiMessageId) return msg;

              // 如果打字机效果还在进行中，不要改变 streamingContent
              const isTypewriterActive = typewriterIntervalRef.current !== null;

              // 如果没有打字机效果或已经完成，将内容转移到 content
              if (!isTypewriterActive && msg.streamingContent) {
                return {
                  ...msg,
                  status: 'complete' as const,
                  content: msg.streamingContent,
                  streamingContent: undefined,
                };
              }

              // 如果打字机还在进行，只更新状态，保留 streamingContent
              return {
                ...msg,
                status: 'complete' as const,
              };
            });
            devLog('chat.done 后的消息列表:', updated);
            return updated;
          });
          setIsStreaming(false);
          setIsConnected(false); // 聊天完成后断开连接状态
          const normalizedOutline = processChatOutline(chatData);
          if (normalizedOutline) {
            onComplete?.(normalizedOutline);
          }
          // connectAgentChatStream 内部已经处理连接关闭
          sseControllerRef.current = null;
          break;

        case 'error':
          const errorData = event as AgentChatEventBase<
            'error',
            { error: string }
          >;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, status: 'error' as const }
                : msg,
            ),
          );
          setIsStreaming(false);
          setError(new Error(errorData.data.error || 'generate failed'));
          break;

        case 'chat.start':
          devLog('chat.start 事件:', event);
          // chat.start 的 message 作为标题
          if (event.message) {
            updateMessageContent(
              aiMessageId,
              { title: event.message },
              'general',
            );
          }
          break;

        default:
          console.log('未处理的事件类型:', (event as any).event_type);
          console.log('未处理事件的完整数据:', event);

          // 尝试从任何未处理的事件中提取消息
          const eventMessage = (event as any).message;
          const dataText =
            (event as any).data?.text ||
            (event as any).data?.data?.text ||
            (event as any).data?.message;

          if ((eventMessage || dataText) && aiMessageId) {
            console.log('从未处理事件提取的内容:', {
              title: eventMessage,
              text: dataText,
            });
            updateMessageContent(
              aiMessageId,
              {
                title: eventMessage || '',
                text: dataText || '',
              },
              'general',
            );
          }
      }
    },
    [onComplete, enableTypewriter, typewriterSpeed, updateMessageContent],
  );

  // 建立 SSE 连接
  const connectToStream = useCallback(
    async (chatThreadId: string) => {
      // 断开现有连接
      disconnect();

      // 创建 AI 消息
      const aiMessageId = crypto.randomUUID();
      currentAiMessageId.current = aiMessageId;

      // 清除该消息之前的内容
      contentProcessor.current.clear(aiMessageId);

      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
        streamingContent: 'connecting...',
      };

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        return newMessages;
      });

      try {
        // 使用新的 API 建立 SSE 连接
        const controller = await connectAgentChatStream(
          chatThreadId,
          handleSSEEvent,
          (error) => {
            console.error('SSE 连接错误:', error);
            setIsConnected(false);
            setIsStreaming(false);
            setError(error);
            onError?.(error);
          },
          {
            maxRetry,
            retryInterval,
            openWhenHidden: true,
          },
        );

        sseControllerRef.current = controller;
        setIsConnected(true);
      } catch (error) {
        console.error('建立 SSE 连接失败:', error);
        setError(error as Error);
        onError?.(error as Error);
      }
    },
    [handleSSEEvent, onError, maxRetry, retryInterval],
  );

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsStreaming(true);
        setError(null);

        // 添加用户消息
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'user',
          content,
          timestamp: new Date(),
          status: 'sending',
        };

        setMessages((prev) => [...prev, userMessage]);

        const chatThreadId = await createChatSession(content);
        setCurrentChatId(chatThreadId);

        // 更新用户消息状态
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: 'sent' as const }
              : msg,
          ),
        );

        // 建立 SSE 连接
        await connectToStream(chatThreadId);
      } catch (error) {
        console.error('发送消息失败:', error);
        setError(error as Error);
        setIsStreaming(false);
        onError?.(error as Error);
      }
    },
    [connectToStream, onError, docId],
  );

  // 断开连接
  const disconnect = useCallback(() => {
    // 清除打字机效果
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }

    // 断开 SSE 连接
    if (sseControllerRef.current) {
      sseControllerRef.current.abort();
      sseControllerRef.current = null;
      setIsConnected(false);
      setIsStreaming(false);
    }
  }, []);

  // 重新连接
  const reconnect = useCallback(() => {
    if (currentChatId) {
      connectToStream(currentChatId);
    }
  }, [currentChatId, connectToStream]);

  // 清除消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    contentProcessor.current.clearAll();
    disconnect();
  }, [disconnect]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    isConnected,
    isStreaming,
    error,
    sendMessage,
    disconnect,
    reconnect,
    clearMessages,
    setMessages,
  };
};
