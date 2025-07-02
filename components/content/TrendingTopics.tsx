'use client';

import { Button, Skeleton } from '@heroui/react';
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

        // 模拟数据
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
const TrendingTopicSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

const SuggestedTopicSkeleton = () => (
  <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
    <Skeleton className="h-5 w-full rounded mb-2" />
    <Skeleton className="h-5 w-3/4 rounded" />
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

  // 分类列表
  const categories = ['All', 'AI', 'Web3', 'Investment', 'Politics'];

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
      className="absolute inset-0 bg-gray-50 overflow-y-auto"
    >
      <div className="min-h-full flex flex-col">
        {/* 顶部导航 */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <h2 className="text-2xl font-bold text-gray-900">
                Trending Topics
              </h2>
            </div>
            <Button
              variant="light"
              onPress={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6">
          <div className="w-full max-w-4xl mx-auto">
            {/* 分类筛选 */}
            <div className="mb-6 flex gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? 'solid' : 'bordered'}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  onPress={() => setSelectedCategory(category)}
                  className="rounded-full"
                  disabled={loading}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* 热门话题列表 */}
            <div className="mb-8">
              <div className="space-y-3">
                {loading
                  ? // 骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                      <TrendingTopicSkeleton key={index} />
                    ))
                  : // 实际数据
                    filteredTopics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
                        onClick={() => onTopicSelect(topic)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {topic.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {topic.timeAgo}
                            </span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${topic.popularity}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
              </div>
            </div>

            {/* 推荐话题 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Suggested Topics
              </h3>
              <div className="space-y-3">
                {loading
                  ? // 骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                      <SuggestedTopicSkeleton key={index} />
                    ))
                  : // 实际数据
                    suggestedTopics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
                        onClick={() => onTopicSelect(topic)}
                      >
                        <h4 className="font-medium text-gray-900 leading-relaxed">
                          {topic.title}
                        </h4>
                      </motion.div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
