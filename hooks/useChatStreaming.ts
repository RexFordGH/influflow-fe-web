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

  // 创建聊天会话
  const createChatSession = async (userMessage: string): Promise<string> => {
    try {
      return await createAgentChat(docId, userMessage);
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  };

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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    status: 'streaming' as const,
                    streamingContent: '正在思考...',
                  }
                : msg,
            ),
          );
          break;

        case 'reasoning.done':
          console.log('推理完成:', event.message);
          break;

        case 'web_search.start':
          console.log('网络搜索开始:', event.message);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    streamingContent: '正在搜索网络...',
                  }
                : msg,
            ),
          );
          break;

        case 'web_search.done':
          console.log('网络搜索完成:', event.message);
          break;

        case 'message.start':
          console.log('开始消息流式输出');
          setIsStreaming(true);
          setIsConnected(true);

          // 清除之前的打字机效果
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          // 初始化流式内容为空
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    status: 'streaming' as const,
                    streamingContent: '',
                    content: '', // 清空之前的内容
                  }
                : msg,
            ),
          );
          break;

        case 'message.done':
          const messageData = event as AgentChatEventBase<
            'message.done',
            MessageDoneData
          >;

          // 调试：打印完整的事件数据
          console.log('message.done 完整数据:', messageData);
          console.log('messageData.data:', messageData.data);

          // 兼容多种数据格式
          const fullText =
            messageData.data?.text ||
            (messageData.data as any)?.['text '] || // 注意可能有空格
            messageData.message || // 尝试从 message 字段获取
            '';

          console.log('提取的消息文本:', fullText);

          if (!fullText) {
            console.error('无法提取消息文本，data结构:', messageData.data);
            return;
          }

          // 清除之前的打字机效果
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          if (enableTypewriter && fullText) {
            // 启用打字机效果
            // console.log('启用打字机效果，文本长度:', fullText.length);
            let currentIndex = 0;

            typewriterIntervalRef.current = setInterval(() => {
              if (currentIndex <= fullText.length) {
                const displayText = fullText.slice(0, currentIndex);

                // console.log(`打字机进度: ${currentIndex}/${fullText.length}`);

                setMessages((prev) => {
                  const updated = prev.map((msg) =>
                    msg.id === aiMessageId
                      ? {
                          ...msg,
                          streamingContent: displayText,
                          status:
                            currentIndex === fullText.length
                              ? ('complete' as const)
                              : ('streaming' as const),
                          content:
                            currentIndex === fullText.length ? fullText : '',
                        }
                      : msg,
                  );
                  // console.log('打字机更新后的消息:', updated.find(m => m.id === aiMessageId));
                  return updated;
                });

                currentIndex++;
              } else {
                // 打字机效果完成
                if (typewriterIntervalRef.current) {
                  clearInterval(typewriterIntervalRef.current);
                  typewriterIntervalRef.current = null;
                }
                // console.log('打字机效果完成');
              }
            }, typewriterSpeed);
          } else {
            // 不启用打字机效果，直接显示完整内容
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: fullText,
                      streamingContent: fullText,
                      status: 'complete' as const,
                    }
                  : msg,
              ),
            );
          }
          break;

        case 'write.start':
          console.log('开始写入 write.start:', event);
          console.log('当前AI消息ID:', aiMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    streamingContent: '正在生成内容...',
                    status: 'streaming' as const,
                  }
                : msg,
            ),
          );
          break;

        case 'write.done':
          const writeData = event as AgentChatEventBase<
            'write.done',
            WriteDoneData
          >;
          console.log('write.done 完整数据:', writeData);
          console.log('writeData.data:', writeData.data);

          // 尝试从write.done提取消息内容
          const writeContent =
            writeData.message ||
            (writeData.data as any)?.message ||
            (writeData.data as any)?.text ||
            '';

          console.log('write.done 提取的内容:', writeContent);

          // 如果有内容，也更新消息内容
          if (writeContent) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: writeContent,
                      streamingContent: writeContent,
                      outline: writeData.data?.outline as any,
                      status: 'complete' as const,
                    }
                  : msg,
              ),
            );
          } else {
            // 只更新大纲
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      outline: writeData.data?.outline as any,
                    }
                  : msg,
              ),
            );
          }
          break;

        case 'chat.done':
          const chatData = event as AgentChatEventBase<
            'chat.done',
            WriteDoneData
          >;
          console.log('chat.done', event, aiMessageId);
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    status: 'complete' as const,
                    streamingContent: undefined,
                  }
                : msg,
            );
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
          // 处理chat.start事件
          if ((event as any).message) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      streamingContent: (event as any).message,
                      status: 'streaming' as const,
                    }
                  : msg,
              ),
            );
          }
          break;

        default:
          console.log('未处理的事件类型:', (event as any).event_type);
          console.log('未处理事件的完整数据:', event);

          // 尝试从任何未处理的事件中提取消息
          const anyMessage =
            (event as any).message ||
            (event as any).data?.text ||
            (event as any).data?.message;
          if (anyMessage && aiMessageId) {
            console.log('从未处理事件提取的消息:', anyMessage);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: anyMessage,
                      streamingContent: anyMessage,
                    }
                  : msg,
              ),
            );
          }
      }
    },
    [onComplete, enableTypewriter, typewriterSpeed],
  );

  // 建立 SSE 连接
  const connectToStream = useCallback(
    async (chatThreadId: string) => {
      // 断开现有连接
      disconnect();

      // 创建 AI 消息
      const aiMessageId = crypto.randomUUID();
      currentAiMessageId.current = aiMessageId;

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
