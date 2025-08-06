'use client';

import { useDraftGeneration, useGenerateThread } from '@/lib/api/services';
import { draftReducer, initialState } from '@/reducers/draftReducer';
import { DraftConfirmationContextType, IChatMessage } from '@/types/draft';
import { IContentFormat } from '@/types/api';
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
  const twitterMutation = useGenerateThread();

  // 生成初始草案
  const generateDraft = useCallback(
    async (userInput: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_THINKING', payload: true });

      // 添加用户消息
      const userMessage: IChatMessage = {
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

        // 添加AI响应消息（包含草稿快照）
        const aiMessage: IChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content: "Let's confirm your writing intent",
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            draftUpdated: true,
            draftSnapshot: response.draft, // 保存当前的草稿数据
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
        const errorMessage: IChatMessage = {
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

  // 生成Twitter内容
  const generateTwitterContent = useCallback(
    async (userInput: string, sessionId: string, contentFormat: IContentFormat) => {
      // 参数验证
      if (!contentFormat) {
        throw new Error('Content format is required for Twitter content generation');
      }
      
      try {
        const response = await twitterMutation.mutateAsync({
          user_input: userInput,
          session_id: sessionId,
          content_format: contentFormat,
          mode: 'draft',
        });

        // 添加成功消息
        const successMessage: IChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content: 'Perfect! Your content has been generated successfully.',
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            isConfirmation: true,
          },
        };
        dispatch({ type: 'ADD_MESSAGE', payload: successMessage });

        // 设置确认状态
        dispatch({ type: 'SET_CONFIRMED', payload: true });

        // 返回生成的内容
        return response;
      } catch (error: any) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error?.message || 'Failed to generate content. Please try again.',
        });

        // 添加错误消息
        const errorMessage: IChatMessage = {
          id: uuidv4(),
          type: 'assistant',
          content:
            'Sorry, there was an error generating the content. Please try again.',
          timestamp: new Date(),
          status: 'error',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      }
    },
    [twitterMutation],
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
      const userMessage: IChatMessage = {
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
      const isConfirmation = confirmationKeywords.some(
        (keyword) => userInput.trim().toLowerCase() === keyword.toLowerCase(),
      );

      try {
        if (isConfirmation) {
          // 添加确认消息
          const confirmMessage: IChatMessage = {
            id: uuidv4(),
            type: 'assistant',
            content: 'Great! Your draft has been confirmed.',
            timestamp: new Date(),
            status: 'sent',
          };
          dispatch({ type: 'ADD_MESSAGE', payload: confirmMessage });
          
          // 确认指令：仅设置确认状态，触发跳转到 ArticleRenderer
          dispatch({ type: 'SET_CONFIRMED', payload: true });
        } else {
          // 非确认指令：继续优化草案
          const response = await draftMutation.mutateAsync({
            user_input: userInput,
            session_id: state.session_id,
          });

          // 添加AI响应消息（包含草稿快照）
          const aiMessage: IChatMessage = {
            id: uuidv4(),
            type: 'assistant',
            content: 'Here is your new overview of the post to be generated.',
            timestamp: new Date(),
            status: 'sent',
            metadata: {
              draftUpdated: true,
              draftSnapshot: response.draft, // 保存当前的草稿数据
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
        }
      } catch (error: any) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error?.message || 'Failed to optimize draft. Please try again.',
        });

        // 添加错误消息
        const errorMessage: IChatMessage = {
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
    [state.session_id, draftMutation, generateTwitterContent],
  );

  // 添加消息
  const addMessage = useCallback(
    (message: Omit<IChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: IChatMessage = {
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
    const skipMessage: IChatMessage = {
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
    generateTwitterContent,
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
