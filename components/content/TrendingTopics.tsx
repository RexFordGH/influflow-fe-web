'use client';

import { Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { Button } from '@/components/base';
import { useTopicTypes, useTrendingTopics } from '@/lib/api/services';
import { type SuggestedTopic, type TrendingTopic } from '@/types/api';

interface TrendingTopicsProps {
  isVisible: boolean;
  onBack: () => void;
  onTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
}

// 骨架屏组件
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

export function TrendingTopics({
  isVisible,
  onBack: _onBack,
  onTopicSelect,
}: TrendingTopicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('ai');

  // 获取可用的话题类型
  const { data: topicTypes } = useTopicTypes();

  // 根据选中的分类获取trending topics数据
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
        {/* 内容区域 */}
        <div className="flex-1 px-[30px] py-14">
          <div className="mx-auto w-full max-w-4xl">
            {/* Trending Topics 部分 */}
            <div className="mb-10">
              {/* 标题 */}
              <h2 className="mb-4 text-lg font-medium text-black">
                Trending Topics
              </h2>

              {/* 分类筛选 */}
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

              {/* 热门话题列表 */}
              <div className="space-y-3">
                {isLoading ? (
                  // 骨架屏
                  Array.from({ length: 5 }).map((_, index) => (
                    <TrendingTopicSkeleton key={index} index={index} />
                  ))
                ) : error ? (
                  // 错误状态
                  <div className="py-8 text-center">
                    <p className="mb-2 text-gray-500">
                      Unable to load trending topics at the moment
                    </p>
                    <p className="text-sm text-gray-400">
                      Please try again later
                    </p>
                  </div>
                ) : (
                  // 实际数据 - 根据Figma设计样式
                  trendingTopics.map((topic: any, index: number) => (
                    <motion.button
                      key={`${topic.title}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => onTopicSelect(topic)}
                      className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-200 px-6 py-1 transition-all duration-200 hover:from-yellow-500 hover:to-yellow-300"
                      style={{
                        width: `${Math.max(432, 880 - index * 110)}px`,
                      }}
                    >
                      <span className="text-lg font-medium text-black text-left">
                        {topic.title}
                      </span>
                      <span className="text-lg font-medium text-gray-600">
                        {topic.value}
                      </span>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Suggested Topics 部分 */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-medium text-black">
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  // 骨架屏
                  Array.from({ length: 5 }).map((_, index) => (
                    <SuggestedTopicSkeleton key={index} />
                  ))
                ) : error ? (
                  // 错误状态
                  <div className="py-8 text-center">
                    <p className="mb-2 text-gray-500">
                      Unable to load suggested topics at the moment
                    </p>
                    <p className="text-sm text-gray-400">
                      Please try again later
                    </p>
                  </div>
                ) : (
                  // 实际数据 - 根据Figma设计样式
                  suggestedTopics.map((topic: any, index: number) => (
                    <motion.button
                      key={`${topic.topic}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      onClick={() => onTopicSelect(topic)}
                      className={`w-full rounded-xl px-[24px] py-[10px] text-left transition-all duration-200 ${
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
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 返回首屏悬浮按钮 */}
        {/* <Button
          size="sm"
          variant="solid"
          onPress={_onBack}
          className="fixed bottom-6 right-6 z-10 size-12 rounded-full bg-black text-white shadow-lg transition-all duration-200 hover:bg-gray-800"
        >
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Button> */}
      </div>
    </div>
  );
}
