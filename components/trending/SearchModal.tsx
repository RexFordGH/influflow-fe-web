'use client';

import { Image, Modal, ModalContent, Skeleton, Tooltip } from '@heroui/react';
import { useEffect, useState } from 'react';

import { useTrendingSearch } from '@/lib/api/services';
import { ITrendsRecommendTweet } from '@/types/api';

import { Button } from '../base';

import { TwitterCard } from './TwitterCard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
}

export function SearchModal({ isOpen, onClose, onConfirm }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTweetIndices, setSelectedTweetIndices] = useState<Set<number>>(
    new Set(),
  );

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 使用搜索API
  const {
    data: tweetData,
    isLoading,
    error,
  } = useTrendingSearch(
    debouncedSearchTerm,
    isOpen && debouncedSearchTerm.trim().length > 0,
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
    // 即使没有选中推文，也可以只传递搜索词
    const selectedTweets = tweetData && selectedTweetIndices.size > 0 
      ? Array.from(selectedTweetIndices).map((index) => tweetData[index])
      : [];
    
    onConfirm(searchTerm, selectedTweets);

    // 重置状态
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedTweetIndices(new Set());
  };

  // 处理关闭
  const handleClose = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedTweetIndices(new Set());
    onClose();
  };

  // 当组件变为可见时，手动触发Twitter widgets加载
  useEffect(() => {
    if (isOpen && !isLoading && tweetData && tweetData.length > 0) {
      if (window.twttr?.widgets) {
        const timer = setTimeout(() => {
          const blockquotes = document.querySelectorAll(
            'blockquote.twitter-tweet',
          );

          blockquotes.forEach((bq) => {
            bq.removeAttribute('data-twitter-extracted');
            const nextSibling = bq.nextElementSibling;
            if (
              nextSibling &&
              nextSibling.tagName === 'IFRAME' &&
              nextSibling.id.includes('twitter-widget')
            ) {
              nextSibling.remove();
            }
          });

          window.twttr.widgets.load();
        }, 200);

        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isLoading, tweetData]);

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
        <div className="flex h-full max-h-[90vh] flex-col bg-white">
          {/* Search Input */}
          <div className="p-[20px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search keywords..."
              className="w-full rounded-lg border-none outline-none px-4 py-3 text-base placeholder-gray-500  focus:outline-none"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!debouncedSearchTerm.trim() ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <p>Enter keywords to search for tweets</p>
              </div>
            ) : isLoading ? (
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
                  {tweetData.map((tweet, index) => {
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
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
