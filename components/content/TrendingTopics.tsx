'use client';

import { Button } from '@/components/base';
import { Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  popularity: number; // 热度值 0-100
}

interface SuggestedTopic {
  id: string;
  title: string;
}

interface TrendingTopicsProps {
  isVisible: boolean;
  onBack: () => void;
  onTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
}

// 模拟API请求hook
const useTrendingData = (isVisible: boolean) => {
  const [loading, setLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([]);

  useEffect(() => {
    // 模拟API请求
    const fetchTrendingData = async () => {
      setLoading(true);
      try {
        // TODO: 替换为实际的API请求
        await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟网络延迟

        // 模拟数据 - 根据Figma设计
        const mockTrendingTopics: TrendingTopic[] = [
          {
            id: '1',
            title: 'OpenAI',
            category: 'AI',
            timeAgo: '20m',
            popularity: 100,
          },
          {
            id: '2',
            title: 'Bitcoin',
            category: 'Investment',
            timeAgo: '17m',
            popularity: 85,
          },
          {
            id: '3',
            title: 'Trump',
            category: 'Politics',
            timeAgo: '13m',
            popularity: 70,
          },
          {
            id: '4',
            title: 'Enigma',
            category: 'AI',
            timeAgo: '8m',
            popularity: 60,
          },
          {
            id: '5',
            title: 'AI Ethics',
            category: 'AI',
            timeAgo: '6m',
            popularity: 50,
          },
        ];

        const mockSuggestedTopics: SuggestedTopic[] = [
          {
            id: '1',
            title:
              "OpenAI vs. The Enigma: 80 Years of Cracking Codes—What's Next?",
          },
          {
            id: '2',
            title:
              "Bitcoin ETFs Are Live—Here's the Quiet Revolution No One's Pricing In",
          },
          {
            id: '3',
            title:
              'Trump, TikTok & the AI Arms Race: How 2024 Politics Rewired Tech Policy',
          },
          {
            id: '4',
            title:
              "From Turing's Enigma to GPT-5 Rumors: 5 Milestones That Changed Digital Freedom",
          },
          {
            id: '5',
            title:
              '10 OpenAI Research Papers Every Non-Coder Can Actually Understand',
          },
        ];

        setTrendingTopics(mockTrendingTopics);
        setSuggestedTopics(mockSuggestedTopics);
      } catch (error) {
        console.error('Failed to fetch trending data:', error);
        // TODO: 处理错误状态
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchTrendingData();
    }
  }, [isVisible]);

  return { loading, trendingTopics, suggestedTopics };
};

// 骨架屏组件
const TrendingTopicSkeleton = ({ index }: { index: number }) => (
  <div
    className="flex items-center justify-between px-6 py-1 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-100"
    style={{
      width: `${Math.max(432, 880 - index * 110)}px`,
    }}
  >
    <Skeleton className="h-[18px] w-20 rounded bg-yellow-200" />
    <Skeleton className="h-[18px] w-8 rounded bg-yellow-200" />
  </div>
);

const SuggestedTopicSkeleton = () => (
  <div className="px-[24px] py-[10px] border border-gray-300 rounded-xl">
    <Skeleton className="h-[18px] w-full rounded mb-2" />
  </div>
);

export function TrendingTopics({
  isVisible,
  onBack,
  onTopicSelect,
}: TrendingTopicsProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { loading, trendingTopics, suggestedTopics } =
    useTrendingData(isVisible);

  // 分类列表 - 根据Figma设计更新
  const categories = ['All', 'AI', 'Web3', 'Investment'];

  // 过滤话题
  const filteredTopics =
    selectedCategory === 'All'
      ? trendingTopics
      : trendingTopics.filter((topic) => topic.category === selectedCategory);

  return (
    <motion.div
      initial={{ y: window.innerHeight }}
      animate={{ y: isVisible ? 0 : window.innerHeight }}
      transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
      className="absolute inset-0 bg-white overflow-y-auto"
    >
      <div className="min-h-full flex flex-col">
        {/* 内容区域 */}
        <div className="flex-1 px-30 py-14">
          <div className="w-full max-w-4xl mx-auto">
            {/* Trending Topics 部分 */}
            <div className="mb-10">
              {/* 标题 */}
              <h2 className="text-lg font-medium text-black mb-4">
                Trending Topics
              </h2>

              {/* 分类筛选 */}
              <div className="mb-4 flex gap-3">
                {categories.map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    variant="bordered"
                    onPress={() => setSelectedCategory(category)}
                    className={`rounded-xl px-3 py-1 border text-lg font-normal ${
                      selectedCategory === category
                        ? 'bg-gray-200 border-gray-200 text-black'
                        : 'border-gray-200 text-black bg-white hover:bg-gray-50'
                    }`}
                    isDisabled={loading}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* 热门话题列表 */}
              <div className="space-y-3">
                {loading
                  ? // 骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                      <TrendingTopicSkeleton key={index} index={index} />
                    ))
                  : // 实际数据 - 根据Figma设计样式
                    filteredTopics.map((topic, index) => (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => onTopicSelect(topic)}
                        className="flex items-center justify-between px-6 py-1 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-200 hover:from-yellow-500 hover:to-yellow-300 transition-all duration-200"
                        style={{
                          width: `${Math.max(432, 880 - index * 110)}px`,
                        }}
                      >
                        <span className="text-lg font-medium text-black">
                          {topic.title}
                        </span>
                        <span className="text-lg font-medium text-gray-600">
                          {topic.timeAgo}
                        </span>
                      </motion.button>
                    ))}
              </div>
            </div>

            {/* Suggested Topics 部分 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-black mb-4">
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {loading
                  ? // 骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                      <SuggestedTopicSkeleton key={index} />
                    ))
                  : // 实际数据 - 根据Figma设计样式
                    suggestedTopics.map((topic, index) => (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        onClick={() => onTopicSelect(topic)}
                        className={`w-full px-[24px] py-[10px] rounded-xl transition-all duration-200 text-left ${
                          index === 0
                            ? 'bg-blue-50 border border-blue-400 hover:bg-blue-100'
                            : 'border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-[18px] font-normal text-black leading-[27px]">
                          {topic.title}
                        </span>
                      </motion.button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
