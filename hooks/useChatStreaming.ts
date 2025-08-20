import { connectAgentChatStream, createAgentChat } from '@/lib/api/agent-chat';
import type {
  AgentChatEvent,
  AgentChatEventBase,
  ChatMessage,
  MessageDoneData,
  WriteDoneData,
} from '@/types/agent-chat';
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
}

interface SSEController {
  abort: () => void;
  isFinished: () => boolean;
}

// 内容累积处理器
class StreamContentAccumulator {
  private contents: Map<string, string[]> = new Map();

  // 添加内容到指定消息（支持标题+内容格式）
  append(
    messageId: string,
    content: string | { title?: string; text?: string },
    type: 'reasoning' | 'write' | 'message' | 'search' | 'general' = 'general',
  ): string {
    if (!content) return this.get(messageId);

    const key = messageId;
    if (!this.contents.has(key)) {
      this.contents.set(key, []);
    }

    const contentList = this.contents.get(key)!;

    // 处理标题和内容
    let formattedContent = '';

    if (typeof content === 'object') {
      // 对象格式：包含标题和内容
      const { title, text } = content;

      if (title) {
        // 标题部分（作为小标题显示）
        switch (type) {
          case 'reasoning':
            formattedContent = `🤔 ${title}`;
            break;
          case 'write':
            formattedContent = `✍️ ${title}`;
            break;
          case 'search':
            formattedContent = `🔍 ${title}`;
            break;
          default:
            formattedContent = `${title}`;
        }

        // 如果有内容，添加到标题后面
        if (text) {
          formattedContent += `\n${text}`;
        }
      } else if (text) {
        // 只有内容，没有标题
        formattedContent = text;
      }
    } else {
      // 字符串格式：直接作为内容
      formattedContent = content;
    }

    if (formattedContent) {
      contentList.push(formattedContent);
    }

    return contentList.join('\n\n');
  }

  // 获取累积的内容
  get(messageId: string): string {
    const contentList = this.contents.get(messageId);
    return contentList ? contentList.join('\n\n') : '';
  }

  // 清除指定消息的内容
  clear(messageId: string): void {
    this.contents.delete(messageId);
  }

  // 清除所有内容
  clearAll(): void {
    this.contents.clear();
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
}: UseChatStreamingOptions): UseChatStreamingReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const sseControllerRef = useRef<SSEController | null>(null);
  const currentAiMessageId = useRef<string | null>(null);
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentAccumulator = useRef(new StreamContentAccumulator());

  // 创建聊天会话
  const createChatSession = async (userMessage: string): Promise<string> => {
    try {
      return await createAgentChat(docId, userMessage);
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  };

  // 更新消息内容的辅助函数
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
      const accumulatedContent = contentAccumulator.current.append(
        messageId,
        content,
        type,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                streamingContent: accumulatedContent,
                status,
              }
            : msg,
        ),
      );

      return accumulatedContent;
    },
    [],
  );

  // 处理 SSE 事件
  const handleSSEEvent = useCallback(
    (event: AgentChatEvent) => {
      const aiMessageId = currentAiMessageId.current;
      if (!aiMessageId) return;

      console.log('handleSSEEvent', event);
      console.log('当前更新的AI消息ID:', aiMessageId);

      // 根据事件类型更新消息
      switch (event.event_type) {
        case 'response.created':
          console.log('响应创建:', event.message);
          setIsConnected(true);
          break;

        case 'response.in_progress':
          console.log('响应进行中:', event.message);
          break;

        case 'reasoning.start':
          console.log('推理开始:', event.message);
          const reasoningStartData = event as any;
          const step =
            reasoningStartData.data?.index !== undefined
              ? `步骤 ${reasoningStartData.data.index + 1}`
              : '';

          // message 作为标题，步骤信息作为内容
          updateMessageContent(
            aiMessageId,
            {
              title: event.message || '开始思考',
              text: step,
            },
            'reasoning',
          );
          break;

        case 'reasoning.done':
          console.log('推理完成:', event.message);
          const reasoningData = event as any;

          // 提取推理内容
          const reasoningText =
            reasoningData.data?.text || reasoningData.data?.data?.text || '';

          // message 作为标题，text 作为内容
          if (event.message || reasoningText) {
            console.log('推理内容:', {
              title: event.message,
              text: reasoningText,
            });
            updateMessageContent(
              aiMessageId,
              {
                title: event.message || '思考完成',
                text: reasoningText,
              },
              'reasoning',
            );
          }
          break;

        case 'web_search.start':
          console.log('网络搜索开始:', event.message);
          updateMessageContent(
            aiMessageId,
            { title: event.message || '开始搜索' },
            'search',
          );
          break;

        case 'web_search.done':
          console.log('网络搜索完成:', event.message);
          const searchData = event as any;
          const searchResults =
            searchData.data?.results || searchData.data?.text || '';

          const resultsText =
            typeof searchResults === 'string'
              ? searchResults
              : searchResults.length
                ? `找到 ${searchResults.length} 个结果`
                : '';

          updateMessageContent(
            aiMessageId,
            {
              title: event.message || '搜索完成',
              text: resultsText,
            },
            'search',
          );
          break;

        case 'message.start':
          console.log('开始消息流式输出:', event.message);
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

          console.log('message.done 完整数据:', messageData);

          // 提取内容文本（不包括message字段，那是标题）
          const contentText =
            (messageData.data as any)?.message || // data.message（这个是内容）
            messageData.data?.text || // data.text
            (messageData.data as any)?.data?.text || // data.data.text
            '';

          console.log('提取的内容:', {
            title: messageData.message,
            text: contentText,
          });

          if (!contentText && !messageData.message) {
            console.warn('message.done 没有提取到任何内容');
            // 不return，保持之前累积的内容
          }

          // 清除打字机效果
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          // message 作为标题，data中的内容作为文本
          if (messageData.message || contentText) {
            // 累积消息内容
            const accumulatedContent = updateMessageContent(
              aiMessageId,
              {
                title: messageData.message || '',
                text: contentText,
              },
              'message',
            );

            if (enableTypewriter && contentText) {
              // 打字机效果：从累积内容的当前长度开始
              const previousLength =
                accumulatedContent.length - contentText.length;
              let currentIndex = previousLength;

              typewriterIntervalRef.current = setInterval(() => {
                if (currentIndex <= accumulatedContent.length) {
                  const displayText = accumulatedContent.slice(0, currentIndex);

                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== aiMessageId) return msg;
                      
                      const isComplete = currentIndex === accumulatedContent.length;
                      return {
                        ...msg,
                        streamingContent: displayText,
                        status: msg.status === 'complete' ? 'complete' : (isComplete ? 'complete' : 'streaming'),
                        content: isComplete ? accumulatedContent : msg.content || '',
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
                            content: accumulatedContent,
                            streamingContent: undefined,
                            status: 'complete' as const,
                          }
                        : msg,
                    ),
                  );
                }
              }, typewriterSpeed);
            } else {
              // 直接显示累积内容
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        streamingContent: accumulatedContent,
                        status: 'complete' as const,
                      }
                    : msg,
                ),
              );
            }
          }
          break;

        case 'write.start':
          console.log('开始写入 write.start:', event);
          updateMessageContent(
            aiMessageId,
            { title: event.message || '开始生成内容' },
            'write',
          );
          break;

        case 'write.done':
          const writeData = event as AgentChatEventBase<
            'write.done',
            WriteDoneData
          >;
          console.log('write.done 完整数据:', writeData);

          // 提取各种可能的内容
          const writeText =
            (writeData.data as any)?.text ||
            (writeData.data as any)?.data?.text ||
            '';
          const writeOutline = writeData.data?.outline;

          // message 作为标题，其他作为内容
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
          console.log('chat.done', event, aiMessageId);

          // 如果有最终的message，添加为标题
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
            console.log('chat.done 后的消息列表:', updated);
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
          setError(new Error(errorData.data.error || '生成失败'));
          break;

        case 'chat.start':
          console.log('chat.start 事件:', event);
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

      // 清除该消息之前的累积内容
      contentAccumulator.current.clear(aiMessageId);

      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
        streamingContent: '连接中...',
      };

      console.log('创建新的AI消息:', aiMessage);
      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        console.log('添加AI消息后的消息列表:', newMessages);
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

        // 每次都创建新的聊天会话，确保用户输入的内容传递给后端
        console.log('创建新的聊天会话，内容:', content);
        const chatThreadId = await createChatSession(content);
        setCurrentChatId(chatThreadId);
        console.log('新的 chatThreadId:', chatThreadId);

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
    contentAccumulator.current.clearAll();
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
  };
};
