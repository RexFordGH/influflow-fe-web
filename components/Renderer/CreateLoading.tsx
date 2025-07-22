'use client';

import { Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CreateArticleLoadingProps {
  topic: string;
  onBack: () => void;
  isError?: boolean;
  errorMessage?: string;
  generationSteps: string[];
  onRetry?: () => void;
  duration?: number; // 初始模拟的总时长
  isFinished?: boolean; // API是否已完成
  onAnimationComplete?: () => void; // 动画完成后的回调
}

const stepItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const Checkmark = () => (
  <motion.svg
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
    className="size-5 text-green-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.path pathLength={1} d="M20 6L9 17l-5-5" />
  </motion.svg>
);

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className="size-4 rounded-full border-2 border-blue-500 border-t-transparent"
  />
);

export function CreateArticleLoading({
  topic,
  onBack,
  isError = false,
  errorMessage,
  generationSteps,
  onRetry,
  duration = 15000, // 默认初始总时长为15秒
  isFinished = false,
  onAnimationComplete,
}: CreateArticleLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // 效果1: 处理初始的、缓慢的模拟加载过程
  useEffect(() => {
    if (isFinished || isError) return;

    const stepInterval = duration / generationSteps.length;
    const timeouts = generationSteps.map((_, index) =>
      setTimeout(
        () => {
          // 更新步骤，但不要超过总步骤数
          setCurrentStep(index + 1);
        },
        (index + 1) * stepInterval,
      ),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isFinished, isError, duration, generationSteps.length]);

  // 效果2: 处理API完成后快速完成剩余动画的逻辑
  useEffect(() => {
    if (isFinished) {
      // 如果动画已经因为超时而跑完，直接调用完成回调
      if (currentStep >= generationSteps.length) {
        setTimeout(() => onAnimationComplete?.(), 500); // 短暂延迟以显示最后一个对勾
        return;
      }

      // 如果动画没走完，则快速播放剩余步骤
      const remainingSteps = generationSteps.length - currentStep;
      const finishDuration = Math.max(1000, remainingSteps * 200);
      const stepInterval = finishDuration / remainingSteps;

      const timeouts = Array.from({ length: remainingSteps }).map((_, index) =>
        setTimeout(
          () => {
            setCurrentStep(currentStep + index + 1);
          },
          (index + 1) * stepInterval,
        ),
      );

      const finalTimeout = setTimeout(() => {
        onAnimationComplete?.();
      }, finishDuration + 300); // 额外缓冲时间

      return () => {
        timeouts.forEach(clearTimeout);
        clearTimeout(finalTimeout);
      };
    }
  }, [isFinished]); // 只依赖 isFinished

  return (
    <div className="flex h-screen flex-col bg-[#FAFAFA]">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-[600px] flex-col items-center gap-[24px] text-center">
          {isError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              {/* ... 错误UI ... */}
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
              >
                <Image
                  src="/icons/face.svg"
                  alt="thinking"
                  width={120}
                  height={120}
                />
              </motion.div>

              <div className="mt-[40px] flex w-full flex-col items-center gap-[16px]">
                {generationSteps.map((step, index) => {
                  const isDone = currentStep > index;
                  const isActive = currentStep === index;
                  // 关键逻辑：如果动画跑完了但API还没回来，强制最后一个step显示loading
                  const isStalled =
                    currentStep >= generationSteps.length && !isFinished;

                  let status: 'done' | 'loading' | 'pending' = 'pending';
                  if (isDone) status = 'done';
                  if (isActive) status = 'loading';
                  if (isStalled && index === generationSteps.length - 1) {
                    status = 'loading';
                  }

                  return (
                    <motion.div
                      key={index}
                      variants={stepItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex w-2/3 items-center justify-start gap-3"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={status}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="flex size-5 items-center justify-center"
                        >
                          {status === 'done' ? (
                            <Checkmark />
                          ) : status === 'loading' ? (
                            <LoadingSpinner />
                          ) : (
                            <div className="size-4 rounded-full bg-gray-300" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                      <p
                        className={`text-left text-[16px] leading-[24px] transition-colors duration-500 ${
                          status === 'done'
                            ? 'text-gray-800'
                            : status === 'loading'
                              ? 'font-medium text-black/70'
                              : 'text-gray-400'
                        }`}
                      >
                        {step}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
