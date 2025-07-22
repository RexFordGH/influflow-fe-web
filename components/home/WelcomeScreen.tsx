'use client';

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { lazy, useEffect, useRef, useState } from 'react';
import ReactPageScroller from 'react-page-scroller';

import { useAuthStore } from '@/stores/authStore';
import { ContentFormat, SuggestedTopic, TrendingTopic, ITrendsRecommendTweet } from '@/types/api';

const TrendingTopicsPage = lazy(() =>
  import('@/components/trending/TrendingTopicsPage').then((module) => ({
    default: module.TrendingTopicsPage,
  })),
);

interface WelcomeScreenProps {
  showTrendingTopics: boolean;
  onScrollToTrending: () => void;
  onBackFromTrending: () => void;
  onTrendingTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
  onTrendingTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
  onTrendingSearchConfirm?: (searchTerm: string, selectedTweets: ITrendsRecommendTweet[]) => void;
  selectedTweets?: any[];
  onRemoveSelectedTweet?: (index: number) => void;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicSubmit: (contentFormat: ContentFormat) => void;
  onWriteByMyself: () => void;
}

export const WelcomeScreen = ({
  showTrendingTopics,
  onScrollToTrending,
  onBackFromTrending,
  onTrendingTopicSelect,
  onTrendingTweetsSelect,
  onTrendingSearchConfirm,
  selectedTweets,
  onRemoveSelectedTweet,
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onWriteByMyself,
}: WelcomeScreenProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedContentFormat, setSelectedContentFormat] =
    useState<ContentFormat>('longform');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 直接使用外部状态，不需要内部同步
  const currentPage = showTrendingTopics ? 1 : 0;

  // 内容格式选项
  const contentFormatOptions = [
    { key: 'longform', label: 'Article', icon: '≣' },
    { key: 'thread', label: 'Threads', icon: '≡' },
  ];

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 重置高度以获取正确的scrollHeight
      textarea.style.height = 'auto';
      // 设置最小高度为100px，最大高度为300px
      const newHeight = Math.max(100, Math.min(300, textarea.scrollHeight));
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [topicInput]);

  // 组件挂载时初始化高度
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  const handleTopicSubmit = () => {
    onTopicSubmit(selectedContentFormat);
  };

  // 处理页面切换
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber === 0) {
      onBackFromTrending();
    } else if (pageNumber === 1) {
      onScrollToTrending();
    }
  };

  return (
    <div className="relative size-full min-w-[1000px]">
      <ReactPageScroller
        pageOnChange={handlePageChange}
        customPageNumber={currentPage}
        animationTimer={600}
        transitionTimingFunction="ease-out"
        containerHeight="100vh"
        containerWidth="100%"
      >
        {/* 首页 */}
        <div className="flex size-full items-center justify-center bg-white">
          <div className="relative flex flex-col px-[24px] text-center">
            <h2 className="text-[24px] font-[600] text-black">
              Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what
              would you like to write about today?
            </h2>

            <div className="relative mt-[24px]">
              <textarea
                ref={textareaRef}
                placeholder="You can start with a topic or an opinion."
                value={topicInput}
                onChange={(e) => onTopicInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    handleTopicSubmit();
                  }
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                onInput={adjustTextareaHeight}
                className="w-full resize-none rounded-2xl border border-gray-200 p-4 pb-[40px] pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                style={{
                  minHeight: '100px',
                  maxHeight: '300px',
                }}
                rows={4}
              />
              {/* Content Format Dropdown */}
              <div className="absolute bottom-[12px] left-[12px]">
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      variant="flat"
                      className="min-w-[100px] rounded-full border-none bg-transparent px-[10px] py-[4px] text-gray-700 backdrop-blur-sm hover:bg-gray-50"
                      endContent={
                        <svg
                          className="ml-1 size-3 opacity-60"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                    >
                      {
                        contentFormatOptions.find(
                          (opt) => opt.key === selectedContentFormat,
                        )?.label
                      }
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Content format selection"
                    selectedKeys={[selectedContentFormat]}
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as ContentFormat;
                      setSelectedContentFormat(selectedKey);
                    }}
                  >
                    {contentFormatOptions.map((option) => (
                      <DropdownItem key={option.key}>
                        {option.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              <Button
                isIconOnly
                color="primary"
                className="absolute bottom-[12px] right-[12px] size-[40px] min-w-0 rounded-full"
                onPress={handleTopicSubmit}
                disabled={!topicInput.trim()}
              >
                <Image
                  src="/icons/send.svg"
                  alt="发送"
                  width={40}
                  height={40}
                  className="pointer-events-none"
                />
              </Button>
            </div>

            {selectedTweets && selectedTweets.length > 0 && (
              <div className="mt-[14px] grid max-w-[700px] grid-cols-3 gap-[8px]">
                {selectedTweets.map((tweet, index) => (
                  <div
                    key={tweet.id}
                    className="relative flex items-center gap-[8px] rounded-[12px] border border-gray-300 bg-white p-[6px] shadow-sm"
                  >
                    <Image
                      src={'/icons/x-icon.svg'}
                      width={32}
                      height={32}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-left text-[12px] font-[500] text-[#757575]">
                        {tweet.author_name}
                      </p>
                      <p className="truncate text-[12px] text-[#8C8C8C]">
                        {(() => {
                          // 提取推文内容的前几个词作为预览
                          const htmlContent = tweet.html;
                          const textContent = htmlContent
                            .replace(/<[^>]*>/g, '')
                            .replace(/&[^;]+;/g, ' ');
                          return textContent.length > 50
                            ? textContent.substring(0, 50) + '...'
                            : textContent;
                        })()}
                      </p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onRemoveSelectedTweet?.(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <span className="text-[20px]">×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-[55px] flex justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-bounce">
                <Image
                  src="/icons/scroll.svg"
                  alt="swipe-up"
                  width={24}
                  height={24}
                />
              </div>
              <span className="text-[18px] font-[500] text-[#448AFF]">
                Scroll down to explore trending topics
              </span>
            </div>
          </div>
        </div>

        {/* Trending Topics 页面 */}
        <div className="size-full ">
          <TrendingTopicsPage
            isVisible={true}
            onBack={onBackFromTrending}
            onTopicSelect={onTrendingTopicSelect}
            onTweetsSelect={(selectedTweets, topicTitle) => {
              // 回到上一页并携带选中的推文数据
              onBackFromTrending();
              onTrendingTweetsSelect?.(selectedTweets, topicTitle);
            }}
            onSearchConfirm={(searchTerm, selectedTweets) => {
              // 回到上一页并携带搜索结果和选中的推文数据
              onBackFromTrending();
              onTrendingSearchConfirm?.(searchTerm, selectedTweets);
            }}
          />
        </div>
      </ReactPageScroller>
    </div>
  );
};
