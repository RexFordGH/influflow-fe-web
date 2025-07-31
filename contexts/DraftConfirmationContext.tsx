'use client';

import { useDraftGeneration } from '@/lib/api/services';
import { draftReducer, initialState } from '@/reducers/draftReducer';
import { ChatMessage, DraftConfirmationContextType } from '@/types/draft';
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

const DraftConfirmationContext = createContext<
  DraftConfirmationContextType | undefined
>(undefined);

export const DraftConfirmationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, dispatch] = useReducer(draftReducer, initialState);

  // API调用
  const draftMutation = useDraftGeneration();

  // 生成初始草案
  const generateDraft = useCallback(
    async (userInput: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_THINKING', payload: true });

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        type: 'user',
        content: userInput,
        timestamp: new Date(),
        status: 'sent',
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      try {
        const response = await draftMutation.mutateAsync({
          user_input: userInput,
        });

        // 添加AI响应消息
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content: "Let's confirm your writing intent",
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            draftUpdated: true,
          },
        };
        dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });

        // 更新草案数据
        dispatch({
          type: 'SET_DRAFT',
          payload: {
            draft: response.draft,
            session_id: response.session_id,
            requires_review: response.requires_review,
          },
        });
      } catch (error: any) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error?.message || 'Failed to generate draft. Please try again.',
        });

        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content:
            'Sorry, there was an error generating the draft. Please try again.',
          timestamp: new Date(),
          status: 'error',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_THINKING', payload: false });
      }
    },
    [draftMutation],
  );

  // 优化草案
  const optimizeDraft = useCallback(
    async (userInput: string) => {
      if (!state.session_id) {
        console.error('No thread ID available for optimization');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_THINKING', payload: true });

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        type: 'user',
        content: userInput,
        timestamp: new Date(),
        status: 'sent',
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // 检查是否是确认意图
      const confirmationKeywords = [
        'ok',
        'OK',
        '确认',
        '通过',
        'approved',
        'confirm',
        '好的',
        '可以',
      ];
      const isConfirmation = confirmationKeywords.some((keyword) =>
        userInput.trim().toLowerCase() === keyword.toLowerCase(),
      );

      try {
        const response = await draftMutation.mutateAsync({
          user_input: isConfirmation ? 'ok' : userInput,
          session_id: state.session_id,
        });

        // 根据响应确定消息内容
        let aiMessageContent =
          'Here is your new overview of the post to be generated.';
        if (isConfirmation && !response.requires_review) {
          aiMessageContent =
            'Great! Your draft has been confirmed. Generating your content now...';
        }

        // 添加AI响应消息
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content: aiMessageContent,
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            draftUpdated: true,
            isConfirmation: isConfirmation && !response.requires_review,
          },
        };
        dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });

        // 更新草案数据
        dispatch({
          type: 'SET_DRAFT',
          payload: {
            draft: response.draft,
            session_id: response.session_id,
            requires_review: response.requires_review,
          },
        });

        // 如果不需要继续审核，则标记为已确认
        if (!response.requires_review) {
          dispatch({ type: 'SET_CONFIRMED', payload: true });
        }
      } catch (error: any) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error?.message || 'Failed to optimize draft. Please try again.',
        });

        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content:
            'Sorry, there was an error optimizing the draft. Please try again.',
          timestamp: new Date(),
          status: 'error',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_THINKING', payload: false });
      }
    },
    [state.session_id, draftMutation],
  );

  // 添加消息
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: uuidv4(),
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
    },
    [],
  );

  // 清空状态
  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  // 确认草案
  const confirmDraft = useCallback(() => {
    dispatch({ type: 'SET_CONFIRMED', payload: true });
  }, []);

  // 跳过草案
  const skipDraft = useCallback(() => {
    dispatch({ type: 'SET_CONFIRMED', payload: true });
    // 添加跳过消息
    const skipMessage: ChatMessage = {
      id: uuidv4(),
      type: 'assistant',
      content: 'Skipping draft confirmation. Generating content directly...',
      timestamp: new Date(),
      status: 'sent',
    };
    dispatch({ type: 'ADD_MESSAGE', payload: skipMessage });
  }, []);

  const value: DraftConfirmationContextType = {
    state,
    generateDraft,
    optimizeDraft,
    addMessage,
    clearState,
    confirmDraft,
    skipDraft,
  };

  return (
    <DraftConfirmationContext.Provider value={value}>
      {children}
    </DraftConfirmationContext.Provider>
  );
};

// 自定义 Hook 用于使用 Context
export const useDraftConfirmationContext = () => {
  const context = useContext(DraftConfirmationContext);
  if (!context) {
    throw new Error(
      'useDraftConfirmationContext must be used within DraftConfirmationProvider',
    );
  }
  return context;
};
