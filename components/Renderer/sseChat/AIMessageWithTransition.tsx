'use client';

import { cn, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/types/agent-chat';

import { StreamingTypewriter } from './StreamingTypewriter';

interface AIMessageWithTransitionProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export const AIMessageWithTransition: React.FC<
  AIMessageWithTransitionProps
> = ({ message }) => {
  // 追踪上一次的标题和类型，用于检测段落切换
  const prevTitleRef = useRef<string | undefined>(message.streamingTitle);
  const prevTypeRef = useRef<string | undefined>(message.streamingType);

  // 过渡状态
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 定时器引用
  const transitionEndTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 检测是否发生段落切换
    const hasNewTitle = message.streamingTitle !== prevTitleRef.current;
    const hasTypeChange = message.streamingType !== prevTypeRef.current;
    const isSectionSwitch =
      (hasNewTitle || hasTypeChange) &&
      message.streamingTitle &&
      prevTitleRef.current &&
      message.status === 'streaming';

    if (isSectionSwitch) {
      // 段落切换检测到
      console.log('段落切换:', {
        从: { title: prevTitleRef.current, type: prevTypeRef.current },
        到: { title: message.streamingTitle, type: message.streamingType },
      });

      // 清除之前的定时器
      if (transitionEndTimer.current) clearTimeout(transitionEndTimer.current);

      // 开始过渡动画
      setIsTransitioning(true);

      // 250ms后结束过渡动画
      transitionEndTimer.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 250);

      // 更新引用
      prevTitleRef.current = message.streamingTitle;
      prevTypeRef.current = message.streamingType;
    } else {
      // 更新引用（保持同步）
      if (message.streamingTitle !== undefined) {
        prevTitleRef.current = message.streamingTitle;
      }
      if (message.streamingType !== undefined) {
        prevTypeRef.current = message.streamingType;
      }
    }

    // 清理函数
    return () => {
      if (transitionEndTimer.current) clearTimeout(transitionEndTimer.current);
    };
  }, [
    message.streamingTitle,
    message.streamingContent,
    message.streamingType,
    message.status,
  ]);

  // 当消息完成时，确保显示最终内容
  useEffect(() => {
    if (message.status === 'complete' || message.status === 'error') {
      setIsTransitioning(false);
    }
  }, [message.status]);

  // 定义动画变体
  const transitionVariants = {
    hidden: {
      opacity: 0.6,
      y: 4,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut' as const,
      },
    },
    transitioning: {
      opacity: 0.6,
      y: 4,
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const,
      },
    },
  };

  const fadeInVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: 'easeInOut' as const,
      },
    },
  };

  const slideInUpVariants = {
    initial: {
      opacity: 0,
      y: 8,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <div className="mb-6 flex flex-col gap-[6px]">
      {/* AI 头像 */}
      <Image src={'/icons/influxy.svg'} width={84} height={24} />

      {/* 消息内容 */}
      <div className={cn('text-[14px] relative')}>
        {message.status === 'streaming' ? (
          <div className="relative">
            {/* 内容区域 */}
            <motion.div
              className="space-y-2"
              variants={transitionVariants}
              initial="visible"
              animate={isTransitioning ? 'transitioning' : 'visible'}
            >
              {/* 标题 - 使用打字机效果 */}
              <AnimatePresence mode="wait">
                {message.streamingTitle && (
                  <motion.div
                    key={message.streamingTitle}
                    className="font-medium text-black"
                    variants={isTransitioning ? fadeInVariants : {}}
                    initial={isTransitioning ? 'initial' : false}
                    animate="animate"
                  >
                    <StreamingTypewriter
                      streamingContent={message.streamingTitle}
                      isStreaming={true}
                      typeSpeed={15} // 标题打字速度更快
                      showCursor={false} // 标题不显示光标
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 内容 */}
              <AnimatePresence mode="wait">
                {message.streamingContent && (
                  <motion.div
                    key={`${message.streamingTitle}-content`}
                    className="text-black/70"
                    variants={isTransitioning ? slideInUpVariants : {}}
                    initial={isTransitioning ? 'initial' : false}
                    animate="animate"
                  >
                    <StreamingTypewriter
                      streamingContent={message.streamingContent}
                      isStreaming={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 加载状态 */}
              {!message.streamingTitle && !message.streamingContent && (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-3 w-3 rounded-full border-2 border-gray-300 border-t-gray-600"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* 完成状态 - 显示最终内容 */}
            {message.streamingTitle && (
              <div className="font-medium text-black">
                {message.streamingTitle}
              </div>
            )}
            {(message.content || message.streamingContent) && (
              <div className="whitespace-pre-wrap break-words text-black/70">
                {message.content || message.streamingContent}
              </div>
            )}
          </motion.div>
        )}

        {/* 错误状态 */}
        <AnimatePresence>
          {message.status === 'error' && (
            <motion.div
              className="mt-2 text-sm text-red-500"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Network error, please retry
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
