'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  IContentFormat,
  IMode,
  ISuggestedTopic,
  ITrendingTopic,
  ITrendsRecommendTweet,
} from '@/types/api';

import { WelcomeScreen } from './WelcomeScreen';

export interface IMainContentProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onTrendingTopicSelect: (topic: ITrendingTopic | ISuggestedTopic) => void;
  onTrendingTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
  onTrendingSearchConfirm?: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
  selectedTweets?: any[];
  onRemoveSelectedTweet?: (index: number) => void;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicSubmit: (contentFormat: IContentFormat, mode: IMode) => void;
  onScrollProgressChange?: (progress: any) => void;
  hasCompletedOnboarding?: boolean | null;
}

export const MainContent = ({
  sidebarCollapsed,
  onToggleSidebar,
  onTrendingTopicSelect,
  onTrendingTweetsSelect,
  onTrendingSearchConfirm,
  selectedTweets,
  onRemoveSelectedTweet,
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onScrollProgressChange,
  hasCompletedOnboarding,
}: IMainContentProps) => {
  const { isAuthenticated } = useAuthStore();
  const { credits } = useSubscriptionStore();
  const router = useRouter();
  
  // 判断是否显示低积分提醒 banner
  const showLowCreditsBanner = isAuthenticated && credits <= 10;

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      animate={{
        marginLeft: isAuthenticated && !sidebarCollapsed ? 320 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      {/* Low Credits Banner */}
      {showLowCreditsBanner && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-40 flex h-[40px] items-center justify-center bg-black text-white"
        >
          <span className="mr-2 text-[14px]">🔥</span>
          <span className="text-[14px]">
            Low credits left. Upgrade to create freely.
          </span>
          <button
            onClick={() => router.push('/subscription')}
            className="ml-3 rounded-md bg-white px-3 py-1 text-[12px] font-medium text-black transition-opacity hover:opacity-90"
          >
            Manage Subscription
          </button>
        </motion.div>
      )}
      
      {isAuthenticated && sidebarCollapsed && (
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onToggleSidebar}
          className="absolute left-4 top-4 z-50 bg-white text-gray-600 shadow-md hover:text-gray-900"
        >
          <Image
            src={'/icons/doubleArrowRounded.svg'}
            alt="arrow-right"
            width={24}
            height={24}
            className="pointer-events-none -scale-x-100"
          />
        </Button>
      )}

      <div className="size-full">
        <WelcomeScreen
          onTrendingTopicSelect={onTrendingTopicSelect}
          onTrendingTweetsSelect={onTrendingTweetsSelect}
          onTrendingSearchConfirm={onTrendingSearchConfirm}
          selectedTweets={selectedTweets}
          onRemoveSelectedTweet={onRemoveSelectedTweet}
          topicInput={topicInput}
          onTopicInputChange={onTopicInputChange}
          onTopicSubmit={onTopicSubmit}
          onScrollProgressChange={onScrollProgressChange}
          hasCompletedOnboarding={hasCompletedOnboarding}
        />
      </div>
    </motion.div>
  );
};
