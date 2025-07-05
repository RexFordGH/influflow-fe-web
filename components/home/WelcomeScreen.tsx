'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { lazy } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { SuggestedTopic, TrendingTopic } from '@/types/api';

// 动态导入TrendingTopics组件
const TrendingTopics = lazy(() =>
  import('@/components/content/TrendingTopics').then((module) => ({
    default: module.TrendingTopics,
  })),
);

// TrendingTopics加载时的骨架屏组件
const TrendingTopicsLoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <div className="w-full max-w-4xl animate-pulse space-y-4 px-8">
      <div className="h-6 w-48 rounded bg-gray-200"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-gradient-to-r from-yellow-200 to-yellow-100"
            style={{ width: `${Math.max(432, 880 - i * 110)}px` }}
          ></div>
        ))}
      </div>
      <div className="mt-8 h-6 w-56 rounded bg-gray-200"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border bg-gray-100"></div>
        ))}
      </div>
    </div>
  </div>
);

interface WelcomeScreenProps {
  showTrendingTopics: boolean;
  onScrollToTrending: () => void;
  onBackFromTrending: () => void;
  onTrendingTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicSubmit: () => void;
  onWriteByMyself: () => void;
}

export const WelcomeScreen = ({
  showTrendingTopics,
  onScrollToTrending,
  onBackFromTrending,
  onTrendingTopicSelect,
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onWriteByMyself,
}: WelcomeScreenProps) => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="relative size-full">
      <motion.div
        initial={{ y: 0 }}
        animate={{
          y: showTrendingTopics
            ? typeof window !== 'undefined'
              ? -window.innerHeight
              : -800
            : 0,
        }}
        transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
        className="absolute inset-0 flex items-center justify-center bg-white"
      >
        <div className="relative flex flex-col gap-[24px] px-[24px] text-center">
          <h2 className="text-[24px] font-[600] text-black">
            Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what would
            you like to write about today?
          </h2>

          <div className="relative">
            <textarea
              placeholder="You can start with a topic or an opinion."
              value={topicInput}
              onChange={(e) => onTopicInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onTopicSubmit();
                }
              }}
              className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
              rows={4}
            />
            <Button
              isIconOnly
              color="primary"
              className="absolute bottom-[12px] right-[12px] size-[40px] min-w-0 rounded-full"
              onPress={onTopicSubmit}
              disabled={!topicInput.trim()}
            >
              <Image
                src="/icons/send.svg"
                alt="发送"
                width={40}
                height={40}
                className="pointer-events-none"
              />
            </Button>
          </div>

          <div className="text-center">
            <div
              onClick={onWriteByMyself}
              className="cursor-pointer text-[16px] font-[500] text-black underline hover:text-[#448AFF]"
            >
              Write by Myself
            </div>
          </div>
        </div>
        {isAuthenticated && (
          <div className="absolute inset-x-0 bottom-[55px] flex justify-center">
            <div
              className="flex cursor-pointer flex-col items-center transition-all duration-300 hover:scale-105 hover:opacity-70"
              onClick={onScrollToTrending}
            >
              <Image
                src="/icons/scroll.svg"
                alt="scroll-down"
                width={24}
                height={24}
              />
              <span className="text-[18px] font-[500] text-[#448AFF]">
                Scroll down to explore trending topics
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {showTrendingTopics && (
        <TrendingTopics
          isVisible={showTrendingTopics}
          onBack={onBackFromTrending}
          onTopicSelect={onTrendingTopicSelect}
        />
      )}
    </div>
  );
};
