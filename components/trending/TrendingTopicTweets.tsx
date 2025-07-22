'use client';

import { Image, Tooltip } from '@heroui/react';
import { useEffect, useState } from 'react';

import { useTrendingRecommend } from '@/lib/api/services';
import { ITrendsRecommendTweet } from '@/types/api';

import { Button } from '../base';

import { TwitterCard } from './TwitterCard';
import { StaticTrendsRecommend } from './mock';

interface TrendingTopicTweetsProps {
  id: string;
  isVisible: boolean;
  onConfirm?: (selectedTweets: ITrendsRecommendTweet[]) => void;
}

export function TrendingTopicTweets({
  isVisible,
  id,
  onConfirm,
}: TrendingTopicTweetsProps) {
  const { data: tweetData } = useTrendingRecommend(id, isVisible);
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
    if (isVisible && tweetData && tweetData.length > 0) {
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
            console.log(`Blockquote ${index}:`, bq.outerHTML.substring(0, 200));

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
  }, [isVisible, tweetData]);

  return (
    <div className="w-full shadow-sm">
      <div className="mb-[16px] flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-sm font-medium text-black">Viral Tweets</h3>
          <p className="text-xs text-gray-600">
            Reference these popular posts to boost views and maximize
            engagement.
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
          {(tweetData || staticData || []).map((tweet, index) => {
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
