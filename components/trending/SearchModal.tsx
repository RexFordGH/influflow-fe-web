'use client';

import { Image, Modal, ModalContent, Skeleton, Tooltip } from '@heroui/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useTrendingSearch } from '@/lib/api/services';
import { ITrendsRecommendTweet } from '@/types/api';

import { Button } from '../base';

import { TwitterCard } from './TwitterCard';

// 优化的推文项组件
const TweetItem = memo(
  ({
    tweet,
    index,
    isSelected,
    onToggle,
  }: {
    tweet: ITrendsRecommendTweet;
    index: number;
    isSelected: boolean;
    onToggle: (index: number) => void;
  }) => {
    const handleToggle = useCallback(() => {
      onToggle(index);
    }, [index, onToggle]);

    return (
      <div className="relative">
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
            onClick={handleToggle}
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
  },
);

TweetItem.displayName = 'TweetItem';

// 声明全局的 twttr 对象
declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (
          id: string,
          element: HTMLElement,
          options?: any,
        ) => Promise<HTMLElement>;
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
  // 新增：外部状态管理
  initialSearchTerm?: string;
  onSearchTermChange?: (term: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  onConfirm,
  initialSearchTerm = '',
  onSearchTermChange,
}: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(initialSearchTerm);
  const [selectedTweetIndices, setSelectedTweetIndices] = useState<Set<number>>(
    new Set(),
  );

  // 同步外部传入的初始搜索词
  useEffect(() => {
    if (initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
      setDebouncedSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm, searchTerm]);

  // 当搜索词改变时通知父组件
  const handleSearchTermChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      onSearchTermChange?.(term);
    },
    [onSearchTermChange],
  );

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 使用搜索API - 只要有搜索词就启用查询，不依赖弹窗状态
  const {
    data: tweetData,
    isLoading,
    error,
    isFetching,
  } = useTrendingSearch(
    debouncedSearchTerm,
    debouncedSearchTerm.trim().length > 0,
  );

  // 区分真正的加载状态：只有在没有数据且正在获取时才显示骨架屏
  const shouldShowSkeleton = useMemo(
    () => !tweetData && (isLoading || isFetching),
    [tweetData, isLoading, isFetching],
  );

  // 切换推文选中状态
  const toggleTweetSelection = useCallback((index: number) => {
    setSelectedTweetIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // 处理确认按钮点击
  const handleConfirm = useCallback(() => {
    // 即使没有选中推文，也可以只传递搜索词
    const selectedTweets =
      tweetData && selectedTweetIndices.size > 0
        ? Array.from(selectedTweetIndices).map((index) => tweetData[index])
        : [];

    onConfirm(searchTerm, selectedTweets);

    // 确认后只重置选择状态，保留搜索词
    setSelectedTweetIndices(new Set());
  }, [tweetData, selectedTweetIndices, onConfirm, searchTerm]);

  // 处理关闭 - 不重置状态，保持搜索内容
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 当组件变为可见且有数据时，手动触发Twitter widgets加载
  useEffect(() => {
    if (isOpen && !shouldShowSkeleton && tweetData && tweetData.length > 0) {
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
  }, [isOpen, shouldShowSkeleton, tweetData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      classNames={{
        base: 'max-h-[90vh]',
        body: 'p-0',
        header: 'p-0',
        footer: 'p-0',
      }}
      hideCloseButton
    >
      <ModalContent>
        <div className="flex h-full max-h-[90vh] flex-col bg-white min-w-[1024px]">
          {/* Search Input */}
          <div className="p-[20px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              placeholder="Enter search keywords..."
              className="w-full rounded-lg border-none outline-none px-4 py-3 text-base placeholder-gray-500  focus:outline-none"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-[20px]">
            {!debouncedSearchTerm.trim() ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <p>Enter keywords to search for tweets</p>
              </div>
            ) : shouldShowSkeleton ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="relative">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 h-[520px]">
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
                ))}
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-gray-500">
                    Unable to search tweets at the moment
                  </p>
                  <p className="text-sm text-gray-400">
                    Please try again later
                  </p>
                </div>
              </div>
            ) : !tweetData || tweetData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-gray-500">No tweets found</p>
                  <p className="text-sm text-gray-400">
                    Try different search keywords
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-black">
                      Viral Tweets
                      {isFetching && tweetData && (
                        <span className="ml-2 text-xs text-blue-500">
                          Updating...
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Use top posts as a reference to craft engaging content.
                    </p>
                  </div>
                  <Button
                    className={`rounded-full ${
                      selectedTweetIndices.size > 0 || searchTerm.trim()
                        ? 'bg-black text-white hover:bg-gray-800'
                        : ''
                    }`}
                    onClick={handleConfirm}
                    isDisabled={!searchTerm.trim()}
                  >
                    Confirm{' '}
                    {selectedTweetIndices.size > 0 &&
                      `(${selectedTweetIndices.size})`}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {tweetData.map((tweet, index) => (
                    <TweetItem
                      key={index}
                      tweet={tweet}
                      index={index}
                      isSelected={selectedTweetIndices.has(index)}
                      onToggle={toggleTweetSelection}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
