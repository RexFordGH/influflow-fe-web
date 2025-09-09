'use client';

import { Image, Skeleton, Tooltip } from '@heroui/react';
import { useEffect, useState } from 'react';

import { useTrendingRecommend } from '@/lib/api/services';
import {
  ISuggestedTopic,
  ITrendingTopic,
  ITrendsRecommendTweet,
} from '@/types/api';

import { Button } from '../base';

import { TwitterCard } from './TwitterCard';
import { StaticTrendsRecommend } from './mock';

interface TrendingTopicTweetsProps {
  id: string;
  isVisible: boolean;
  suggested?: string;
  onConfirm?: (selectedTweets: ITrendsRecommendTweet[]) => void;
}

interface NewTrendingTopicTweetsProps {
  id: string;
  isVisible: boolean;
  suggested?: ISuggestedTopic;
  onTopicSelect: (topic: ITrendingTopic | ISuggestedTopic) => void;
  onConfirm?: (selectedTweets: ITrendsRecommendTweet[]) => void;
}

export function TrendingTopicTweets({
  isVisible,
  id,
  onConfirm,
}: TrendingTopicTweetsProps) {
  const { data: tweetData, isLoading } = useTrendingRecommend(id, isVisible);
  const staticData = StaticTrendsRecommend[id] || [];
  const [selectedTweetIndices, setSelectedTweetIndices] = useState<Set<number>>(
    new Set(),
  );

  // 切换推文选中状态
  const toggleTweetSelection = (index: number) => {
    setSelectedTweetIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 处理确认按钮点击
  const handleConfirm = () => {
    if (selectedTweetIndices.size === 0) {
      return; // 没有选中任何推文，不执行任何操作
    }

    const selectedTweets = Array.from(selectedTweetIndices).map(
      (index) => tweetData![index],
    );
    onConfirm?.(selectedTweets);
  };

  // 当组件变为可见时，手动触发Twitter widgets加载
  useEffect(() => {
    if (isVisible && !isLoading && tweetData && tweetData.length > 0) {
      console.log('Checking Twitter widgets availability...');
      console.log('window.twttr:', window.twttr);
      console.log('window.twttr?.widgets:', window.twttr?.widgets);

      if (window.twttr?.widgets) {
        // 延迟一点确保DOM渲染完成
        const timer = setTimeout(() => {
          console.log('Manually loading Twitter widgets...');
          const blockquotes = document.querySelectorAll(
            'blockquote.twitter-tweet',
          );
          console.log('Found blockquotes:', blockquotes.length);

          // 清除所有已处理的标记，让Twitter重新处理
          blockquotes.forEach((bq, index) => {
            // console.log(`Blockquote ${index}:`, bq.outerHTML.substring(0, 200));

            // 移除Twitter已处理的标记
            bq.removeAttribute('data-twitter-extracted');

            // 移除可能存在的处理后的iframe
            const nextSibling = bq.nextElementSibling;
            if (
              nextSibling &&
              nextSibling.tagName === 'IFRAME' &&
              nextSibling.id.includes('twitter-widget')
            ) {
              nextSibling.remove();
            }
          });

          console.log('Cleared Twitter processed attributes, reloading...');
          window.twttr.widgets.load();
        }, 200);

        return () => clearTimeout(timer);
      } else {
        console.error(
          'Twitter widgets not available! Checking script loading...',
        );
        // 检查Twitter脚本是否存在
        const twitterScript = document.querySelector(
          'script[src*="platform.twitter.com"]',
        );
        console.log('Twitter script element:', twitterScript);

        if (!twitterScript) {
          console.error('Twitter script not found in DOM!');
        }
      }
    }
  }, [isVisible, isLoading, tweetData]);

  return (
    <div className="w-full shadow-sm">
      <div className="mb-[16px] flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-sm font-medium text-black">Viral Tweets</h3>
          <p className="text-xs text-gray-600">
            Use top posts as a reference to craft engaging content.
          </p>
        </div>
        <Button
          className={`rounded-full ${
            selectedTweetIndices.size > 0
              ? 'bg-black text-white hover:bg-gray-800'
              : ''
          }`}
          onClick={handleConfirm}
          isDisabled={selectedTweetIndices.size === 0}
        >
          Confirm{' '}
          {selectedTweetIndices.size > 0 && `(${selectedTweetIndices.size})`}
        </Button>
      </div>

      {/* Tweets 网格 */}
      <div
        className="overflow-y-auto"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="grid grid-cols-3 gap-3">
          {isLoading
            ? // 骨架屏 - 显示6个推文的占位符
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="relative">
                  <div className="h-[520px] rounded-2xl border border-gray-200 bg-white p-4">
                    {/* 头部信息 */}
                    <div className="mb-3 flex items-center gap-3">
                      <Skeleton className="size-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-24 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>

                    {/* 内容 */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-4/5 rounded" />
                      <Skeleton className="h-4 w-3/5 rounded" />
                    </div>

                    {/* 底部交互 */}
                    <div className="mt-4 flex items-center gap-6">
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                </div>
              ))
            : (tweetData || staticData || []).map((tweet, index) => {
                const isSelected = selectedTweetIndices.has(index);
                return (
                  <div key={index} className="relative">
                    <TwitterCard html={tweet.html} className="flex-1" />

                    <Tooltip
                      content="Use as Reference"
                      closeDelay={0}
                      placement="top"
                      classNames={{
                        content: 'bg-black text-white',
                        arrow: 'bg-black border-black',
                      }}
                    >
                      <div
                        onClick={() => toggleTweetSelection(index)}
                        className={`absolute right-[8px] top-[14px] cursor-pointer rounded-[8px] bg-white p-[8px] transition-colors hover:bg-[#E8E8E8]`}
                      >
                        <Image
                          src="/icons/check.svg"
                          alt="Select Tweet"
                          width={24}
                          height={24}
                          className={isSelected ? 'invert' : ''}
                        />
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

export function NewTrendingTopicTweets({
  isVisible,
  id,
  suggested,
  onConfirm,
  onTopicSelect,
}: NewTrendingTopicTweetsProps) {
  const { data: tweetData, isLoading } = useTrendingRecommend(id, isVisible);
  const staticData = StaticTrendsRecommend[id] || [];
  const [selectedTweetIndices, setSelectedTweetIndices] = useState<Set<number>>(
    new Set(),
  );

  // 切换推文选中状态
  const toggleTweetSelection = (index: number) => {
    setSelectedTweetIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 处理确认按钮点击
  const handleConfirm = () => {
    if (selectedTweetIndices.size === 0) {
      return; // 没有选中任何推文，不执行任何操作
    }

    const selectedTweets = Array.from(selectedTweetIndices).map(
      (index) => tweetData![index],
    );
    onConfirm?.(selectedTweets);
  };

  // 当组件变为可见时，手动触发Twitter widgets加载
  useEffect(() => {
    if (isVisible && !isLoading && tweetData && tweetData.length > 0) {
      console.log('Checking Twitter widgets availability...');
      console.log('window.twttr:', window.twttr);
      console.log('window.twttr?.widgets:', window.twttr?.widgets);

      if (window.twttr?.widgets) {
        // 延迟一点确保DOM渲染完成
        const timer = setTimeout(() => {
          console.log('Manually loading Twitter widgets...');
          const blockquotes = document.querySelectorAll(
            'blockquote.twitter-tweet',
          );
          console.log('Found blockquotes:', blockquotes.length);

          // 清除所有已处理的标记，让Twitter重新处理
          blockquotes.forEach((bq, index) => {
            // console.log(`Blockquote ${index}:`, bq.outerHTML.substring(0, 200));

            // 移除Twitter已处理的标记
            bq.removeAttribute('data-twitter-extracted');

            // 移除可能存在的处理后的iframe
            const nextSibling = bq.nextElementSibling;
            if (
              nextSibling &&
              nextSibling.tagName === 'IFRAME' &&
              nextSibling.id.includes('twitter-widget')
            ) {
              nextSibling.remove();
            }
          });

          console.log('Cleared Twitter processed attributes, reloading...');
          window.twttr.widgets.load();
        }, 200);

        return () => clearTimeout(timer);
      } else {
        console.error(
          'Twitter widgets not available! Checking script loading...',
        );
        // 检查Twitter脚本是否存在
        const twitterScript = document.querySelector(
          'script[src*="platform.twitter.com"]',
        );
        console.log('Twitter script element:', twitterScript);

        if (!twitterScript) {
          console.error('Twitter script not found in DOM!');
        }
      }
    }
  }, [isVisible, isLoading, tweetData]);

  return (
    <div className="w-full shadow-sm">
      {/* 标题 */}
      <div className="flex flex-col w">
        <span className="mb-[12px] text-[#828282] text-[16px]">Topic</span>

        <div id="suggested-topics" className="mb-[24px] space-y-3">
          <button
            onClick={() => suggested && onTopicSelect(suggested)}
            className={`
              relative
              w-[896px] rounded-xl bg-white
              px-[24px] py-[16px] text-left
              transition-colors duration-150
              hover:border-blue-400 hover:bg-blue-100
            `}
            style={{
              background: `
                linear-gradient(to right,  #DDE9FF4D 0%, #DDE9FF4D 30%, #FFFFFF 100%),
                linear-gradient(to bottom, #DDE9FF4D 0%, #DDE9FF4D 70%, #FFFFFF 100%)
              `,
              backgroundBlendMode: 'multiply',
            }}
          >
            <span className="text-[16px] font-medium leading-[27px] block">
              {suggested?.topic}
            </span>
            <Image
              src="/icons/send_new.svg"
              alt="Select Tweet"
              width={10}
              height={10}
              radius="none"
              className="absolute right-[24px] top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-80"
              classNames={{
                // 关键：把定位样式作用到真实的 <img> 元素
                img: 'absolute right-[24px] top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-80',
                wrapper: 'static', // 避免包装层乱定位
              }}
            />
          </button>
        </div>
      </div>

      <div className="mb-[12px] flex items-center justify-between">
        <div>
          {/* <h3 className="mb-1 text-sm font-medium text-black">Viral Tweets</h3> */}
          <p className="text-[#828282] text-[16px]">Use As References.</p>
        </div>
        <Button
          className={`rounded-full h-[32px] ${
            selectedTweetIndices.size > 0 ? 'w-[100px]' : 'w-[81px]'
          } ${
            selectedTweetIndices.size > 0
              ? 'bg-black text-white hover:bg-gray-800'
              : ''
          }`}
          onClick={handleConfirm}
          isDisabled={selectedTweetIndices.size === 0}
        >
          Confirm{' '}
          {selectedTweetIndices.size > 0 && `(${selectedTweetIndices.size})`}
        </Button>
      </div>

      {/* Tweets 网格 */}
      <div
        id="viral-tweets"
        className="overflow-y-auto"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="grid grid-cols-3 gap-3">
          {isLoading
            ? // 骨架屏 - 显示6个推文的占位符
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="relative">
                  <div className="h-[520px] rounded-2xl border border-gray-200 bg-white p-4">
                    {/* 头部信息 */}
                    <div className="mb-3 flex items-center gap-3">
                      <Skeleton className="size-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-24 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>

                    {/* 内容 */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-4/5 rounded" />
                      <Skeleton className="h-4 w-3/5 rounded" />
                    </div>

                    {/* 底部交互 */}
                    <div className="mt-4 flex items-center gap-6">
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                </div>
              ))
            : (tweetData || staticData || []).map((tweet, index) => {
                const isSelected = selectedTweetIndices.has(index);
                return (
                  <div key={index} className="relative">
                    <TwitterCard html={tweet.html} className="flex-1" />

                    <Tooltip
                      content="Use as Reference"
                      closeDelay={0}
                      placement="top"
                      classNames={{
                        content: 'bg-black text-white',
                        arrow: 'bg-black border-black',
                      }}
                    >
                      <div
                        onClick={() => toggleTweetSelection(index)}
                        className={`absolute right-[8px] top-[14px] cursor-pointer rounded-[8px] bg-white p-[8px] transition-colors hover:bg-[#E8E8E8]`}
                      >
                        <Image
                          src="/icons/check.svg"
                          alt="Select Tweet"
                          width={24}
                          height={24}
                          className={isSelected ? 'invert' : ''}
                        />
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
