'use client';

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { lazy, useState } from 'react';
import ReactPageScroller from 'react-page-scroller';

import { useAuthStore } from '@/stores/authStore';
import { ContentFormat, SuggestedTopic, TrendingTopic } from '@/types/api';

// 动态导入TrendingTopics组件
const TrendingTopics = lazy(() =>
  import('@/components/content/TrendingTopics').then((module) => ({
    default: module.TrendingTopics,
  })),
);

// TrendingTopics加载时的骨架屏组件
const TrendingTopicsLoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <div className="w-full max-w-4xl animate-pulse space-y-4 px-8">
      <div className="h-6 w-48 rounded bg-gray-200"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-gradient-to-r from-yellow-200 to-yellow-100"
            style={{ width: `${Math.max(432, 880 - i * 110)}px` }}
          ></div>
        ))}
      </div>
      <div className="mt-8 h-6 w-56 rounded bg-gray-200"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border bg-gray-100"></div>
        ))}
      </div>
    </div>
  </div>
);

interface WelcomeScreenProps {
  showTrendingTopics: boolean;
  onScrollToTrending: () => void;
  onBackFromTrending: () => void;
  onTrendingTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
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
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onWriteByMyself,
}: WelcomeScreenProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedContentFormat, setSelectedContentFormat] =
    useState<ContentFormat>('longform');

  // 直接使用外部状态，不需要内部同步
  const currentPage = showTrendingTopics ? 1 : 0;

  // 内容格式选项
  const contentFormatOptions = [
    { key: 'longform', label: 'Article', icon: '≣' },
    { key: 'thread', label: 'Threads', icon: '≡' },
  ];

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
    <div className="relative size-full">
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
          <div className="relative flex flex-col gap-[24px] px-[24px] text-center">
            <h2 className="text-[24px] font-[600] text-black">
              Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what
              would you like to write about today?
            </h2>

            <div className="relative">
              <textarea
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
                  // 阻止滚动事件冒泡到父级组件，避免触发页面切换
                  e.stopPropagation();
                }}
                className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pb-[36px] pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
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
        <div className="size-full">
          <TrendingTopics
            isVisible={true}
            onBack={onBackFromTrending}
            onTopicSelect={onTrendingTopicSelect}
          />
        </div>
      </ReactPageScroller>
    </div>
  );
};
