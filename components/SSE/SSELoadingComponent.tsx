'use client';

import { Button, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Typewriter } from '../shared/Typewriter';

export interface StageInfo {
  id: string;
  name: string;
  displayName: string;
  status: 'pending' | 'in_progress' | 'completed';
  content?: string;
}

interface SSELoadingComponentProps {
  topic: string;
  onBack: () => void;
  stages: Record<string, StageInfo>;
  currentStage: string | null;
  streamContent: string;
  error?: string | null;
}

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className="size-5 rounded-full border-2 border-blue-500 border-t-transparent"
  />
);

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
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      d="M20 6L9 17l-5-5"
    />
  </motion.svg>
);

export function SSELoadingComponent({
  topic,
  onBack,
  stages,
  currentStage,
  streamContent,
  error,
}: SSELoadingComponentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [completedText, setCompletedText] = useState<string>('');
  const [currentText, setCurrentText] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  // 处理新的流式内容
  useEffect(() => {
    if (!streamContent) return;
    
    // 计算新增的文本
    const newText = streamContent.slice(completedText.length);
    if (newText) {
      setCurrentText(newText);
      setIsTyping(true);
    }
  }, [streamContent, completedText]);

  const handleTypewriterComplete = () => {
    setCompletedText(streamContent);
    setCurrentText('');
    setIsTyping(false);
  };

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [completedText, currentText]);

  if (error) {
    return (
      <div className="flex h-screen flex-col bg-[#FAFAFA]">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">{error}</h2>
            <Button
              className="mt-4"
              color="primary"
              onPress={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#FAFAFA]">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">{topic}</h1>
        <Button
          variant="light"
          size="sm"
          onPress={onBack}
        >
          返回
        </Button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：阶段列表 */}
        <div className="flex-1 flex flex-col justify-center items-center border-r border-gray-200 bg-white p-6">
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
            {Object.values(stages).map((stage) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="mt-0.5 flex size-6 items-center justify-start">
                  <AnimatePresence mode="wait">
                    {stage.status === 'completed' ? (
                      <Checkmark key="check" />
                    ) : stage.status === 'in_progress' ? (
                      <LoadingSpinner key="loading" />
                    ) : (
                      <motion.div
                        key="pending"
                        className="size-5 rounded-full bg-gray-300"
                      />
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 flex items-center">
                  <p
                    className={`text-sm font-medium ${
                      stage.status === 'completed'
                        ? 'text-gray-800'
                        : stage.status === 'in_progress'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    }`}
                  >
                    {stage.displayName}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右侧：内容展示 */}
        <div className="flex-1  p-6">
          <div className="mx-auto max-w-3xl">
            {/* 当前阶段标题 */}
            {currentStage && stages[currentStage] && (
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-700">
                  {stages[currentStage].displayName}
                </h2>
              </div>
            )}
            <div
              ref={contentRef}
              className="max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg p-6"
            >
              {completedText || currentText ? (
                <div className="space-y-4">
                  {/* 已完成的文本 */}
                  {completedText && (
                    <div className="whitespace-pre-wrap text-gray-700">
                      {completedText}
                    </div>
                  )}
                  
                  {/* 正在打字的文本 */}
                  {isTyping && currentText && (
                    <div className="whitespace-pre-wrap text-gray-700">
                      <Typewriter
                        text={currentText}
                        speed={20}
                        onComplete={handleTypewriterComplete}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-lg font-medium text-gray-600">
                      正在生成内容...
                    </div>
                    <div className="text-sm text-gray-400">
                      这可能需要一些时间，请耐心等待
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
