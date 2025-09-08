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

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { goToStepAfterStableSameAnchor } from '@/utils/tutorial';

import { BackgroundGradientAnimation } from '../ui/background-gradient-animation';

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
  hasCompletedOnboarding?: boolean | null;
}

const ContentFormatOptions = [
  { key: 'longform', label: 'Long-form Threads', icon: '≣' },
  { key: 'thread', label: 'Threads', icon: '≡' },
  { key: 'deep_research', label: 'Deep Research', icon: '≡' },
];

const ModeOptions = [
  { key: 'lite', label: 'Lite Mode' },
  { key: 'analysis', label: 'Analysis Mode' },
  // { key: 'draft', label: 'Chatbot Mode' },
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
  const [hasCompletedOnboardingLocal, setHasCompletedOnboardingLocal] =
    useState(false);
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

  // 初始化引导，仅在客户端执行，并使用 localStorage 记录是否完成
  useEffect(() => {
    // 检查用户是否已登录，未登录用户不显示新手引导
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping onboarding');
      return;
    }
    // 在页面等待1300ms后，再进入新手引导
    setTimeout(() => {
      const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';

      if (typeof window === 'undefined') return;

      const hasCompleted =
        window.localStorage.getItem(ONBOARDING_KEY) === 'true';

      // 设置本地状态以反映onboarding完成状态
      setHasCompletedOnboardingLocal(hasCompleted);

      if (hasCompleted) return;

      const tour = driver({
        smoothScroll: true,
        stagePadding: 10,
        stageRadius: 12,
        showButtons: ['close', 'next'], // 显示关闭按钮
        nextBtnText: 'NEXT',
        prevBtnText: 'BACK',
        onCloseClick: async () => {
          if (
            !tour.hasNextStep() ||
            confirm(
              'Are you sure you want to skip the onboarding? You might miss helpful tips for getting started.',
            )
          ) {
            tour.destroy();

            const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';
            // Set ONBOARDING_KEY
            window.localStorage.setItem(ONBOARDING_KEY, 'true');
          }
        },
        steps: [
          {
            element: '#textarea-ref',
            popover: {
              title: 'Choose Format & Mode',
              description: `
                    Before generating, pick how you want your content:<br>
                    <ul>
                      <li> Format:<span style="color:#3b82f6;"><em>Threads</em></span> for Twitter threads, <span style="color:#3b82f6;"><em>Long-form Tweet</em></span> for mid-length posts, or <span style="color:#3b82f6;"><em>Deep Research</em></span> for in-depth articles.</li>
                      <li> Mode:<span style="color:#3b82f6;"><em>Lite Mode</em></span> for quick drafts, <span style="color:#3b82f6;"><em>Analysis Mode</em></span> for deeper insights.</li>
                    </ul>
                    `,
              side: 'bottom',
              align: 'start',
              popoverClass: 'driverjs-textarea driverjs-basic',
              onNextClick: () => {
                const pop = document.querySelector(
                  '.driver-popover',
                ) as HTMLElement | null;
                if (!pop) return tour.moveNext();

                // 1) 先让当前弹窗消失
                pop.classList.add('fade-out');

                // 等待popover消失后，再滚动到trending-topics
                const target = document.querySelector('#trending-topics');
                if (!target) return tour.moveNext();

                // 先滚到目标，再进入下一步
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest',
                });

                setTimeout(() => {
                  tour.moveNext();
                }, 1000);
              },
            },
          },
          {
            element: '#trending-topics',
            popover: {
              title: 'What’s Trending',
              description:
                'Stay up to date with what’s buzzing right now. Discover the hottest topics, each with a collection of popular posts that people are engaging with the most.',
              side: 'bottom',
              align: 'center',
              popoverClass: 'driverjs-trending driverjs-basic',
              onNextClick: async () => {
                // 打开第一个trending topics
                setHasCompletedOnboardingLocal(true);

                const pop = document.querySelector(
                  '.driver-popover',
                ) as HTMLElement | null;
                if (!pop) return tour.moveNext();

                // 1) 先让当前弹窗消失
                pop.classList.add('fade-out');

                await goToStepAfterStableSameAnchor(tour, '#viral-tweets', {
                  expectChange: false,
                  timeout: 300,
                  frames: 1,
                  minDelay: 50,
                });
              },
            },
          },
          {
            element: '#viral-tweets',
            popover: {
              title: 'Use Viral Tweets as References',
              description:
                'Click on any trending topic to see the most popular posts under it. Choose as many posts as you like as references, and instantly generate fresh posts inspired by them.',
              side: 'left',
              align: 'center',
              popoverClass: 'viral-tweets driverjs-basic',
              onNextClick: async () => {
                const pop = document.querySelector(
                  '.driver-popover',
                ) as HTMLElement | null;
                if (!pop) return tour.moveNext();

                // 1) 先让当前弹窗消失
                pop.classList.add('fade-out');

                // 滚动到trending-topics-type
                const target = document.querySelector('#suggested-topics');
                if (!target) return tour.moveNext();

                // 先滚到目标，再进入下一步
                target.scrollIntoView({
                  block: 'center',
                  inline: 'nearest',
                });

                setTimeout(() => {
                  tour.moveNext();
                }, 1000);
              },
            },
          },
          {
            element: '#suggested-topics',
            popover: {
              title: 'Pick a Topic, Start Writing',
              description:
                'Get instant content ideas based on trending discussions. We’ll recommend ready-to-use titles — just pick one, and it will be added to your chat box for quick editing and fast content generation.',
              side: 'top',
              align: 'center',
              popoverClass: 'suggested-topics driverjs-basic',
              onNextClick: async () => {
                setTimeout(() => {
                  tour.moveNext();
                }, 1000);
              },
            },
          },
          {
            element: '#customize-my-style',
            popover: {
              title: 'Personalize Your Tone',
              description:
                'Personalize tone, mimic styles you love, and let AI write as you. Start by adding your intro to unlock fully tailored content.',
              side: 'top',
              align: 'center',
              popoverClass: 'customize-my-style driverjs-basic',
              onNextClick: async () => {
                // 跳转到/profile页面
                window.location.href = '/profile';
              },
            },
          },
          {
            // 占位步骤，用于跳转
            popover: {
              title: 'Happy useing',
            },
          },
        ],
        onHighlightStarted: (el) => {
          (el as HTMLElement).setAttribute('inert', ''); // 禁用交互/焦点
          (el as HTMLElement).classList.add('tour-noninteractive'); // 叠加指针禁用（双保险）
        },
        onDestroyStarted: () => {}, // 什么都不做，禁止用户点击非高亮处
      });

      tour.drive();

      // 容器滚动时刷新
      scrollContainerRef.current?.addEventListener('scroll', () => {
        if (tour.isActive()) {
          tour.refresh();
        }
      });

      // 窗口缩放时刷新
      window.addEventListener('resize', () => {
        if (tour.isActive()) {
          tour.refresh();
        }
      });
    }, 1300);
  }, [isAuthenticated]);

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
          className="relative m-3 flex min-h-[94vh] items-center justify-center overflow-hidden rounded-[20px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BackgroundGradientAnimation
            containerClassName="absolute inset-0 -z-10 h-full w-full"
            interactive={true}
          />
          <div className="relative flex flex-col px-[24px] text-center">
            <h2 className="text-[24px] font-[400] text-black">
              Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what
              would you like to write about today?
            </h2>

            <div id="textarea-ref" className="relative mt-[24px]">
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
                className="w-full resize-none rounded-2xl p-4 pb-[58px] pr-12 text-gray-700  placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                style={{
                  minHeight: '120px',
                  maxHeight: '300px',
                  height: '120px',
                }}
              />
              {/* Content Format Dropdown */}
              <div className="absolute inset-x-0 bottom-[7px] flex items-center justify-start gap-[4px] rounded-b-2xl bg-white py-3 pl-3">
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      variant="flat"
                      className="mr-[6px] min-w-[100px] rounded-full border border-gray-200 bg-transparent px-[10px] py-[4px] text-gray-700 backdrop-blur-sm hover:bg-gray-50"
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
                          'min-w-[100px] rounded-full border border-gray-200 bg-transparent px-[10px] py-[4px] text-gray-700 backdrop-blur-sm hover:bg-gray-50',
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
                className="absolute bottom-[12px] right-[12px] mb-[3px] size-[40px] min-w-0 rounded-full"
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
          {/* <div className="absolute inset-x-0 bottom-[55px] flex justify-center">
            <div className="flex flex-col items-center">
              <ScrollHint scrollY={scrollY} />
            </div>
          </div> */}
        </motion.div>

        {/* Trending Topics Section */}
        <motion.div
          ref={trendingRef}
          className="relative m-3 flex min-h-screen items-center justify-center overflow-hidden rounded-[20px] bg-white"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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
              hasCompletedOnboarding={hasCompletedOnboardingLocal}
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
