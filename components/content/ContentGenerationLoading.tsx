'use client';

import { Button, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';

interface ContentGenerationLoadingProps {
  topic: string;
  onBack: () => void;
  isError?: boolean;
  errorMessage?: string;
  isRegenerating?: boolean;
  generationStep: number;
  generationSteps: string[];
  onRetry?: () => void;
}

// 动画variants定义
const stepItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const stepsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.8,
      delayChildren: 0.2,
    },
  },
};

const loadingIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function ContentGenerationLoading({
  topic,
  onBack,
  isError = false,
  errorMessage,
  isRegenerating = false,
  generationStep,
  generationSteps,
  onRetry,
}: ContentGenerationLoadingProps) {
  return (
    <div className="flex h-screen flex-col bg-[#FAFAFA)]">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center flex flex-col items-center gap-[24px]">
          {isError ? (
            /* 错误状态 */
            <>
              <div className="mb-8">
                <div className="relative mx-auto mb-4 size-16">
                  <div className="absolute inset-0 rounded-full bg-red-100"></div>
                  <div className="flex size-full items-center justify-center">
                    <svg
                      className="size-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="mb-2 text-2xl font-bold text-red-600">
                Generation Failed
              </h2>

              <p className="mb-2 text-gray-600">
                Topic:{' '}
                <span className="font-medium text-blue-600">{topic}</span>
              </p>

              <p className="mb-8 text-sm text-red-500">{errorMessage}</p>

              <div className="flex justify-center gap-3">
                {onRetry && (
                  <Button color="primary" onPress={onRetry} className="px-8">
                    Retry
                  </Button>
                )}
                <Button variant="light" onPress={onBack} className="px-8">
                  Back
                </Button>
              </div>
            </>
          ) : (
            /* 加载状态 */
            <>
              <motion.div
                variants={loadingIconVariants}
                initial="hidden"
                animate="visible"
              >
                <Image
                  src="/icons/face.svg"
                  alt="thinking"
                  width={120}
                  height={120}
                />
              </motion.div>

              <AnimatePresence>
                <motion.div
                  variants={stepsContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-[40px] flex flex-col gap-[16px]"
                >
                  {generationSteps.map((step, index) => (
                    <motion.div
                      key={`${step}-${index}`}
                      variants={stepItemVariants}
                    >
                      <p className="text-[16px] text-[#757575] leading-[24px]">
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
