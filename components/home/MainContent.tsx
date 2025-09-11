'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import {
  IContentFormat,
  IMode,
  ITrendingTopic,
  ITrendsRecommendTweet,
} from '@/types/api';

import { WelcomeScreen } from './WelcomeScreen';

export interface IMainContentProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onTrendingTopicSelect: (topic: ITrendingTopic | string) => void;
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
