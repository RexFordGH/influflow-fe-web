'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { Button } from '@/components/base';
import { useTopicTypes, useTrendingTopics } from '@/lib/api/services';
import { type SuggestedTopic, type TrendingTopic } from '@/types/api';

import { TrendingTopicTweets } from './TrendingTopicTweets';

interface TrendingTopicsProps {
  isVisible: boolean;
  onBack: () => void;
  onTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
}

const TrendingTopicSkeleton = ({ index }: { index: number }) => (
  <div
    className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-100 px-6 py-1"
    style={{
      width: `${Math.max(432, 880 - index * 110)}px`,
    }}
  >
    <Skeleton className="h-[18px] w-20 rounded bg-yellow-200" />
    <Skeleton className="h-[18px] w-8 rounded bg-yellow-200" />
  </div>
);

const SuggestedTopicSkeleton = () => (
  <div className="rounded-xl border border-gray-300 px-[24px] py-[10px]">
    <Skeleton className="mb-2 h-[18px] w-full rounded" />
  </div>
);

// Trending Topic Item 组件（带点击功能）
const TrendingTopicItem = ({
  id,
  topic,
  index,
  onTweetsSelect,
}: {
  id: string;
  topic: any;
  index: number;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* <CopyToClipboard text={topic.title}> */}
      <div className="flex items-start justify-start gap-[16px]">
        <span className="pt-[6px] text-[18px] font-[500] text-[#8C8C8C]">
          #{index + 1}
        </span>

        <button
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-200 px-6 py-1 transition-colors duration-150 hover:from-yellow-500 hover:to-yellow-300"
          style={{
            width: `${Math.max(432, 880 - index * 110)}px`,
          }}
        >
          <span className="text-left text-lg font-medium text-black">
            {topic.title}
          </span>
          <div className="flex items-center gap-[10px]">
            <span className="text-lg font-medium text-gray-600">
              {topic.value}
            </span>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -10,
              }}
              transition={{ duration: 0.2 }}
              className="text-gray-600"
            >
              {isOpen ? (
                <ChevronDownIcon className="size-5" />
              ) : (
                <ChevronRightIcon className="size-5" />
              )}
            </motion.div>
          </div>
        </button>
      </div>
      {/* </CopyToClipboard> */}

      {/* Trending Topic Tweets 展开区域 */}
      <motion.div
        className="mt-3"
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? 'auto' : 0,
          display: isOpen ? 'block' : 'none',
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        style={{ overflow: 'hidden' }}
      >
        <TrendingTopicTweets
          isVisible={isOpen}
          id={id}
          onConfirm={(selectedTweets) => {
            onTweetsSelect?.(selectedTweets, topic.title);
          }}
        />
      </motion.div>
    </div>
  );
};

export function TrendingTopicsPage({
  isVisible,
  onBack: _onBack,
  onTopicSelect,
  onTweetsSelect,
}: TrendingTopicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('ai');

  const { data: topicTypes } = useTopicTypes();

  const {
    data: trendingData,
    isLoading,
    error,
  } = useTrendingTopics(isVisible ? selectedCategory : '');

  const trendingTopics = trendingData?.trending_topics || [];
  const suggestedTopics = trendingData?.suggested_topics || [];

  // 分类列表：显示可用的话题类型
  const categories = topicTypes?.map((type: { id: string; label: string }) => ({
    id: type.id,
    label: type.label,
  }));

  return (
    <div className="size-full overflow-y-auto bg-white">
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-[30px] py-14">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-medium text-black">
                Trending Topics
              </h2>

              {/* type */}
              <div className="mb-4 flex gap-3">
                {categories?.map((category: { id: string; label: string }) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant="bordered"
                    onPress={() => setSelectedCategory(category.id)}
                    className={`rounded-xl border px-3 py-1 text-lg font-normal ${
                      selectedCategory === category.id
                        ? 'border-gray-200 bg-gray-200 text-black'
                        : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                    }`}
                    isDisabled={isLoading}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Trending Topics */}
              <div className="space-y-3">
                {isLoading ? (
                  <TrendingTopicSkeletons />
                ) : error ? (
                  <TrendingTopicError />
                ) : (
                  trendingTopics.map((topic: TrendingTopic, index: number) => (
                    <TrendingTopicItem
                      key={`${topic.title}-${index}`}
                      topic={topic}
                      index={index}
                      id={topic.id}
                      onTweetsSelect={onTweetsSelect}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-black">
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  <SuggestTopicSkeletons />
                ) : error ? (
                  <SuggestTopicError />
                ) : (
                  suggestedTopics.map((topic: any, index: number) => (
                    <button
                      key={`${topic.topic}-${index}`}
                      onClick={() => onTopicSelect(topic)}
                      className={`w-full rounded-xl px-[24px] py-[10px] text-left transition-colors duration-150 ${
                        index === 0
                          ? 'border border-blue-400 bg-blue-50 hover:bg-blue-100'
                          : 'border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="">
                        <span className="text-[18px] font-normal leading-[27px] text-black">
                          {topic.topic}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TrendingTopicSkeletons = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TrendingTopicSkeleton key={index} index={index} />
  ));
};

const TrendingTopicError = () => {
  return (
    <div className="py-8 text-center">
      <p className="mb-2 text-gray-500">
        Unable to load trending topics at the moment
      </p>
      <p className="text-sm text-gray-400">Please try again later</p>
    </div>
  );
};

const SuggestTopicSkeletons = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <SuggestedTopicSkeleton key={index} />
  ));
};

const SuggestTopicError = () => {
  return (
    <div className="py-8 text-center">
      <p className="mb-2 text-gray-500">
        Unable to load suggested topics at the moment
      </p>
      <p className="text-sm text-gray-400">Please try again later</p>
    </div>
  );
};
