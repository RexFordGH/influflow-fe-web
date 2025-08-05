'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/base';
import { useTopicTypes, useTrendingTopics } from '@/lib/api/services';
import {
  type ISuggestedTopic,
  type ITrendingTopic,
  type ITrendsRecommendTweet,
} from '@/types/api';

import { SearchModal } from './SearchModal';
import { TrendingTopicTweets } from './TrendingTopicTweets';

interface TrendingTopicsProps {
  isVisible: boolean;
  onBack: () => void;
  onTopicSelect: (topic: ITrendingTopic | ISuggestedTopic) => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
  onSearchConfirm?: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
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
  isOpen,
  onToggle,
  onTweetsSelect,
}: {
  id: string;
  topic: any;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    onToggle();
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
          {/* 对topic.value 进行隐藏*/}
          {/* <div className="flex items-center gap-[10px]">
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
          </div> */}
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
  onSearchConfirm,
}: TrendingTopicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('ai');
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(
    0,
  ); // 默认展开第一个
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchWidgetsLoaded, setSearchWidgetsLoaded] = useState<
    Record<string, boolean>
  >({});

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

  // 处理话题展开/收起的逻辑
  const handleTopicToggle = (index: number) => {
    setExpandedTopicIndex(expandedTopicIndex === index ? null : index);
  };

  // 当切换分类时，重置展开状态到第一个
  useEffect(() => {
    setExpandedTopicIndex(0);
  }, [selectedCategory]);

  // 优化回调函数
  const handleSearchModalClose = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  const handleSearchConfirm = useCallback(
    (searchTerm: string, selectedTweets: ITrendsRecommendTweet[]) => {
      onSearchConfirm?.(searchTerm, selectedTweets);
      setIsSearchModalOpen(false);
    },
    [onSearchConfirm],
  );

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleWidgetsLoadedChange = useCallback(
    (term: string, loaded: boolean) => {
      setSearchWidgetsLoaded((prev) => ({
        ...prev,
        [term]: loaded,
      }));
    },
    [],
  );

  return (
    <div className="size-full overflow-y-auto bg-white">
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-[30px] py-14">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-10">
              <div className="flex items-center justify-between">
                <h2 className="mb-4 text-lg font-medium text-black">
                  Trending Topics
                </h2>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 "
                >
                  <MagnifyingGlassIcon className="size-4" />
                  <span>Search</span>
                </button>
              </div>

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
                  trendingTopics.map((topic: ITrendingTopic, index: number) => (
                    <TrendingTopicItem
                      key={`${topic.title}-${index}`}
                      topic={topic}
                      index={index}
                      id={topic.id}
                      isOpen={expandedTopicIndex === index}
                      onToggle={() => handleTopicToggle(index)}
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

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={handleSearchModalClose}
        onConfirm={handleSearchConfirm}
        initialSearchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        widgetsLoaded={searchWidgetsLoaded}
        onWidgetsLoadedChange={handleWidgetsLoadedChange}
      />
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
