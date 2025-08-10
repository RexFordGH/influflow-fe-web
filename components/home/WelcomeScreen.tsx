'use client';

import {
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuthStore } from '@/stores/authStore';
import '@/styles/welcome-screen.css';
import {
  IContentFormat,
  IMode,
  ISuggestedTopic,
  ITrendingTopic,
  ITrendsRecommendTweet,
} from '@/types/api';

const TrendingTopicsPage = lazy(() =>
  import('@/components/trending/TrendingTopicsPage').then((module) => ({
    default: module.TrendingTopicsPage,
  })),
);

interface WelcomeScreenProps {
  onTrendingTopicSelect: (topic: ITrendingTopic | ISuggestedTopic) => void;
  onTrendingTweetsSelect?: (selectedTweets: any[], topicTitle: string) => void;
  onTrendingSearchConfirm?: (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => void;
  selectedTweets?: any[];
  onRemoveSelectedTweet?: (index: number) => void;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicSubmit: (contentFormat: IContentFormat, mode: IMode) => void;
  onScrollProgressChange?: (progress: any) => void;
}

const ContentFormatOptions = [
  { key: 'longform', label: 'Long-form Tweet', icon: '≣' },
  { key: 'thread', label: 'Threads', icon: '≡' },
  { key: 'deep_research', label: 'Deep Research', icon: '≡' },
];

const ModeOptions = [
  { key: 'lite', label: 'Lite Mode' },
  { key: 'analysis', label: 'Analysis Mode' },
  { key: 'draft', label: 'Chatbot Mode' },
];

export const WelcomeScreen = ({
  onTrendingTopicSelect,
  onTrendingTweetsSelect,
  onTrendingSearchConfirm,
  selectedTweets,
  onRemoveSelectedTweet,
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onScrollProgressChange,
}: WelcomeScreenProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedContentFormat, setSelectedContentFormat] =
    useState<IContentFormat>('longform');
  const [selectedMode, setSelectedMode] = useState<IMode>('analysis');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const homepageRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);

  const isDeepResearch = useMemo(() => {
    return selectedContentFormat === 'deep_research';
  }, [selectedContentFormat]);

  // 滚动相关
  const { scrollY, scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });

  // 传递滚动进度给父组件
  useEffect(() => {
    if (onScrollProgressChange) {
      const unsubscribe = scrollYProgress.on('change', () => {
        onScrollProgressChange(scrollYProgress);
      });
      return unsubscribe;
    }
  }, [scrollYProgress, onScrollProgressChange]);

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
    onTopicSubmit(selectedContentFormat, selectedMode);
  };

  // 自动滚动到顶部
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  // 创建事件处理器，包含自动回滚逻辑
  const createTrendingEventHandler = useCallback(
    <T extends any[]>(
      originalCallback: ((...args: T) => void) | undefined,
      ...args: T
    ) => {
      if (originalCallback) {
        originalCallback(...args);
        // 延迟300ms执行回滚，给用户足够时间看到反馈
        setTimeout(scrollToTop, 300);
      }
    },
    [scrollToTop],
  );

  return (
    <div className="relative size-full min-w-[1000px]">
      {/* 主滚动容器 */}
      <div
        ref={scrollContainerRef}
        className="scroll-container relative h-screen w-full overflow-y-auto"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
        }}
      >
        {/* 首页 Section */}
        <motion.div
          ref={homepageRef}
          className="flex min-h-screen items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
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
              <div className="absolute bottom-[12px] left-[12px] flex items-center justify-start gap-[4px]">
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
                        ContentFormatOptions.find(
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
                      const selectedKey = Array.from(keys)[0] as IContentFormat;
                      if (selectedKey) {
                        setSelectedContentFormat(selectedKey);
                      }
                    }}
                  >
                    {ContentFormatOptions.map((option) => (
                      <DropdownItem key={option.key}>
                        {option.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>

                {!isDeepResearch && (
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button
                        size="sm"
                        variant="flat"
                        className={cn(
                          'min-w-[100px] rounded-full border-none bg-transparent px-[10px] py-[4px] text-gray-700 backdrop-blur-sm hover:bg-gray-50',
                        )}
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
                          ModeOptions.find((opt) => opt.key === selectedMode)
                            ?.label
                        }
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="mode selection"
                      selectedKeys={[selectedMode]}
                      selectionMode="single"
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as IMode;
                        if (selectedKey) {
                          setSelectedMode(selectedKey);
                        }
                      }}
                    >
                      {ModeOptions.map((option) => (
                        <DropdownItem key={option.key}>
                          {option.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                )}
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
              <ScrollHint scrollY={scrollY} />
            </div>
          </div>
        </motion.div>

        {/* Trending Topics Section */}
        <motion.div
          ref={trendingRef}
          className="min-h-screen w-full"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <Suspense fallback={<TrendingTopicsLoader />}>
            <TrendingTopicsPage
              isVisible={true}
              onBack={() => scrollToTop()}
              onTopicSelect={(topic) =>
                createTrendingEventHandler(onTrendingTopicSelect, topic)
              }
              onTweetsSelect={(selectedTweets, topicTitle) => {
                createTrendingEventHandler(
                  onTrendingTweetsSelect,
                  selectedTweets,
                  topicTitle,
                );
              }}
              onSearchConfirm={(searchTerm, selectedTweets) => {
                createTrendingEventHandler(
                  onTrendingSearchConfirm,
                  searchTerm,
                  selectedTweets,
                );
              }}
            />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
};

// 滚动提示组件
const ScrollHint: React.FC<{ scrollY: any }> = ({ scrollY }) => {
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);
  const y = useTransform(scrollY, [0, 100], [0, -20]);

  return (
    <motion.div style={{ opacity, y }} className="flex flex-col items-center">
      <motion.div
        className="animate-bounce"
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Image
          src="/icons/scroll.svg"
          alt="scroll-down"
          width={24}
          height={24}
        />
      </motion.div>
      <span className="text-[18px] font-[500] text-[#448AFF]">
        Scroll down to explore trending topics
      </span>
    </motion.div>
  );
};

// Trending Topics 加载组件
const TrendingTopicsLoader: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <motion.div
      className="size-8 rounded-full border-4 border-blue-500 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);
