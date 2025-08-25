'use client';

import { goToStepAfterStableSameAnchor } from '@/utils/tutorial';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, cn, Input, Textarea, Tooltip } from '@heroui/react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { queryTweetDetail } from '@/lib/api/services';
import { useAuthStore } from '@/stores/authStore';
import { ITone, ProfileData } from '@/utils/profileStorage';
import { debugSupabaseAuth } from '@/utils/supabaseDebug';
import {
  loadProfileFromSupabase,
  saveProfileToSupabase,
} from '@/utils/supabaseProfile';

import { addToast } from '../base/toast';

// 常量定义
const STYLE_OPTIONS = [
  { value: 'YourStyle', label: 'My Style' },
  { value: 'Expert', label: 'Professional' },
  { value: 'Humorous', label: 'Humorous' },
  { value: 'Motivational', label: 'Inspirational' },
  { value: 'Customized', label: 'Customize' },
] as const;

const SUMMARY_MAP: Partial<Record<ITone, string>> = {
  Expert: `- Use precise terminology, formal register, and standards or white-paper citations\n- Avoid slang, emojis, and exclamation marks\n- Structure from overview to detailed implications with clear subheadings`,
  Motivational: `- Employ energetic verbs (like “build, create”)\n- Use positive adjectives\n- Weave in success stories and forward-looking calls to action throughout the longform`,
  Humorous: `- Inject clever puns, meme or pop-culture references\n- Occasional CAPS for punch lines\n- Use emojis generously throughout to amplify comedic timing and visual punchlines\n- Humour must stay brand-safe (PG-13)`,
};

const EMPTY_URLS = ['', '', ''];
const TWEET_FETCH_DELAY = 2000;

// 后台获取推文内容并保存 - 已废弃，现在在 handleSubmit 中同步处理
// const fetchAndSaveTweetExamples = async (
//   urls: string[],
//   setUserStyleSummary: (summary: string | undefined) => void,
// ) => {
//   try {
//     const validUrls = urls.filter((url) => url.trim() !== '');

//     // 如果没有有效的 URL，清空 tweet_examples
//     if (validUrls.length === 0) {
//       const updateData: ProfileData = {
//         tweet_examples: [],
//       };
//       await saveProfileToSupabase(updateData);
//       console.log('Tweet examples cleared');
//       setUserStyleSummary(undefined);
//       return;
//     }

//     const tweetDetailsPromises = validUrls.map((url) =>
//       queryTweetDetail(url).catch((err) => {
//         console.error(`Failed to fetch tweet detail for ${url}:`, err);
//         return null;
//       }),
//     );

//     const tweetDetails = await Promise.all(tweetDetailsPromises);
//     const tweetTexts = tweetDetails
//       .filter((detail) => detail && detail.tweet_text)
//       .map((detail) => detail!.tweet_text);

//     if (tweetTexts.length > 0) {
//       // 保存 tweet_examples 到 Supabase
//       const updateData: ProfileData = {
//         tweet_examples: tweetTexts,
//       };
//       await saveProfileToSupabase(updateData);
//       console.log('Tweet examples saved successfully:', tweetTexts);

//       // 延迟后重新拉取数据，获取后端生成的 user_style_summary
//       setTimeout(async () => {
//         const { data: updatedProfile, error } = await loadProfileFromSupabase();
//         if (updatedProfile && !error) {
//           // 更新后端生成的字段
//           if (updatedProfile.user_style_summary) {
//             setUserStyleSummary(updatedProfile.user_style_summary);
//           }
//         }
//       }, TWEET_FETCH_DELAY);
//     }
//   } catch (error) {
//     console.error('Failed to fetch and save tweet examples:', error);
//   }
// };

// 获取推文内容的辅助函数
const fetchTweetTexts = async (urls: string[]): Promise<string[]> => {
  if (urls.length === 0) return [];

  const tweetDetailsPromises = urls.map((url) =>
    queryTweetDetail(url).catch((err) => {
      console.error(`Failed to fetch tweet detail for ${url}:`, err);
      return null;
    }),
  );

  const tweetDetails = await Promise.all(tweetDetailsPromises);

  // 保持与 URLs 数组对应的顺序，失败的位置用空字符串
  return tweetDetails.map((detail) => detail?.tweet_text || '');
};

interface ProfilePageProps {
  onBack: () => void;
}

// 辅助函数：填充数组到指定长度
const padArray = <T,>(arr: T[], emptyValue: T, length: number): T[] => {
  return [...arr, ...Array(length).fill(emptyValue)].slice(0, length);
};

// 辅助函数：加载 profile 数据到状态
const loadProfileToState = (
  profile: ProfileData,
  setters: {
    setSelectedStyle: (style: ITone | null) => void;
    setPersonalIntro: (intro: string) => void;
    setAccountName: (name: string) => void;
    setUserStyleSummary: (summary: string | undefined) => void;
    setTweetExampleUrls: (urls: string[]) => void;
    setHasTweetData: (has: boolean) => void;
  },
) => {
  const {
    setSelectedStyle,
    setPersonalIntro,
    setAccountName,
    setUserStyleSummary,
    setTweetExampleUrls,
    setHasTweetData,
  } = setters;

  // 检查是否有 user_tweets 数据
  const hasTweets = profile.user_tweets && profile.user_tweets.length > 0;
  setHasTweetData(!!hasTweets);

  // 如果没有 user_tweets 且当前选择是 YourStyle，改为 null
  if (!hasTweets && profile.tone === 'YourStyle') {
    setSelectedStyle(null);
  } else {
    setSelectedStyle(profile.tone || null);
  }

  // 设置其他字段
  if (profile.bio) setPersonalIntro(profile.bio);
  if (profile.account_name) setAccountName(profile.account_name);
  if (profile.user_style_summary)
    setUserStyleSummary(profile.user_style_summary);
  if (profile.tweet_example_urls !== undefined) {
    console.log('Loading tweet_example_urls:', profile.tweet_example_urls);
    setTweetExampleUrls(padArray(profile.tweet_example_urls, '', 3));
  } else {
    console.log('No tweet_example_urls found in profile');
  }
};

export const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // 状态管理
  const [selectedStyle, setSelectedStyle] = useState<ITone | null>(null);
  const [personalIntro, setPersonalIntro] = useState(user?.bio || '');
  const [accountName, setAccountName] = useState(
    user?.account_name || user?.name || '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [userStyleSummary, setUserStyleSummary] = useState<
    string | undefined
  >();
  const [tweetExampleUrls, setTweetExampleUrls] =
    useState<string[]>(EMPTY_URLS);
  const [hasTweetData, setHasTweetData] = useState(false);

  // 创建 setters 对象用于传递给辅助函数
  const setters = {
    setSelectedStyle,
    setPersonalIntro,
    setAccountName,
    setUserStyleSummary,
    setTweetExampleUrls,
    setHasTweetData,
  };

  // 加载数据
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);

      try {
        // 从 Supabase 加载数据
        const { data: supabaseProfile, error } =
          await loadProfileFromSupabase();
        if (supabaseProfile && !error) {
          console.log('Loading from Supabase:', supabaseProfile);
          loadProfileToState(supabaseProfile, setters);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();

    // 检查是否需要显示新手引导
    const ONBOARDING_KEY = 'ifw_onboarding_completed_v1';
    const hasCompleted = window.localStorage.getItem(ONBOARDING_KEY) === 'true';

    // 如果新手引导未完成，且当前页面是从新手引导跳转过来的，则显示引导
    if (!hasCompleted) {
      // 检查 URL 参数或 sessionStorage 中是否有标记
      const urlParams = new URLSearchParams(window.location.search);
      const fromOnboarding =
        urlParams.get('fromOnboarding') ||
        sessionStorage.getItem('fromOnboarding');

      if (fromOnboarding) {
        // 延迟一下确保页面完全加载
        setTimeout(() => {
          initProfileOnboarding();
        }, 1200);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理样式切换后的等待逻辑
  const waitForStyleChange = async (newStyle: ITone) => {
    // 同步更新样式状态
    flushSync(() => setSelectedStyle(newStyle));
    // 等待DOM重新渲染完成
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 强制重新计算布局，确保driver.js能正确计算位置
    void document.body.offsetHeight;

    // 等待额外的帧以确保所有样式变化都已应用
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  };

  const initProfileOnboarding = () => {
    const tour = driver({
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
          element: '#style-section',
          popover: {
            title: 'Choose Your Own Style',
            description:
              "If you want AI to learn your own Twitter style, choose My Style. We've captured your voice so it can write just like you.",
            side: 'bottom',
            align: 'start',
            popoverClass: 'style-section-start driverjs-basic',
            onNextClick: async () => {
              await waitForStyleChange('Expert');
              // 使用快速路径：不等待变化，最小延迟+1帧稳定
              await goToStepAfterStableSameAnchor(tour, '#style-section', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '#style-section',
          popover: {
            title: 'Start Quickly with a Style',
            description:
              "If you don't have your own style yet, you can start quickly with our three preset styles (Humorous, Professional, Inspirational).",
            side: 'bottom',
            align: 'center',
            popoverClass: 'style-section-center driverjs-basic',
            onNextClick: async () => {
              await waitForStyleChange('Customized');
              await goToStepAfterStableSameAnchor(tour, '#style-section', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '#style-section',
          popover: {
            title: 'Mimic Any Tweet Style',
            description:
              "If you'd like to write in the style of another creator, simply paste one or more of their tweets into Customize. The AI will learn from them and generate content that closely matches their tone and style.",
            side: 'bottom',
            align: 'end',
            popoverClass: 'style-section-end driverjs-basic',
            onNextClick: async () => {
              await waitForStyleChange('Customized');
              await goToStepAfterStableSameAnchor(tour, '#style-section', {
                expectChange: false,
                timeout: 300,
                frames: 1,
                minDelay: 50,
              });
            },
          },
        },
        {
          element: '#personal-introduction',
          popover: {
            title: 'Tell Us About Yourself',
            description:
              'Share a short personal intro—your background, interests, and perspective—so AI can write as you, with your unique voice.',
            side: 'top',
            align: 'center',
            popoverClass: 'personal-introduction driverjs-basic',
            onNextClick: async () => {
              await waitForStyleChange('Customized');

              router.push('/article-tutorial');
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
      onDestroyStarted: () => {
        // 什么都不做，禁止用户点击非高亮处
      },
    });

    tour.drive();
  };

  // 处理提交
  const handleSubmit = useCallback(async () => {
    // 如果选择了 Customized，检查所有非空链接的合法性
    if (selectedStyle === 'Customized') {
      const invalidUrls = tweetExampleUrls.filter(
        (url) => url.trim() !== '' && isValidUrl(url) !== true,
      );
      if (invalidUrls.length > 0) {
        addToast({
          title: 'Please enter valid Twitter/X post links',
          color: 'danger',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // 调试认证状态
      await debugSupabaseAuth();

      let profileData: ProfileData;

      // 如果选择了 Customized，先获取推文内容
      if (selectedStyle === 'Customized') {
        const validUrls = tweetExampleUrls.filter((url) => url.trim() !== '');
        const tweetTexts = await fetchTweetTexts(validUrls);

        // 准备要保存的数据，包含同步的 tweet_examples
        profileData = {
          account_name: accountName,
          bio: personalIntro,
          tone: selectedStyle as ITone,
          tweet_example_urls: validUrls,
          tweet_examples: tweetTexts, // 同步保存
        };
      } else {
        // 非 Customized 模式的保存逻辑
        profileData = {
          account_name: accountName,
          bio: personalIntro,
          tone: (selectedStyle || '') as ITone,
          tweet_example_urls: [],
          tweet_examples: [], // 清空推文
        };
      }

      console.log('Submitting profile data:', profileData);

      // 保存到 Supabase
      const { success, error } = await saveProfileToSupabase(profileData);

      if (!success) {
        console.error('Supabase save failed:', error);
        throw new Error(error || 'Failed to save to Supabase');
      }

      // 如果是 Customized 模式，延迟获取后端生成的 user_style_summary
      if (selectedStyle === 'Customized') {
        setTimeout(async () => {
          const { data: updatedProfile } = await loadProfileFromSupabase();
          if (updatedProfile?.user_style_summary) {
            setUserStyleSummary(updatedProfile.user_style_summary);
          }
        }, TWEET_FETCH_DELAY);
      }

      addToast({
        title: 'Saved Successfully',
        color: 'success',
      });

      // onBack();
    } catch (error) {
      console.error('Failed to save profile:', error);
      addToast({
        title: 'Failed to save',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountName, personalIntro, selectedStyle, tweetExampleUrls]);

  // 处理风格选择
  const handleStyleSelect = useCallback(
    (style: ITone) => {
      // 如果选择 YourStyle 但没有 tweet 数据，不允许选择
      if (style === 'YourStyle' && !hasTweetData) {
        return;
      }

      if (selectedStyle === style) {
        setSelectedStyle(null);
      } else {
        setSelectedStyle(style);
      }
    },
    [selectedStyle, hasTweetData],
  );

  // 校验链接是否合法的 Twitter/X 推文链接
  const isValidUrl = (url: string): boolean | 'invalid-url' | 'not-twitter' => {
    if (!url || url.trim() === '') return true; // 空值被认为是合法的

    try {
      // 尝试构造 URL 对象，如果失败则说明不是合法的 URL
      new URL(url);

      // 检查是否是 Twitter/X 的推文链接
      const twitterRegex =
        /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[a-zA-Z0-9_]+\/status\/\d+/;
      if (!twitterRegex.test(url)) {
        return 'not-twitter';
      }

      return true;
    } catch {
      return 'invalid-url';
    }
  };

  // 处理链接改变
  const handleLinkChange = useCallback((index: number, value: string) => {
    setTweetExampleUrls((prev) => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
  }, []);

  // 处理登出
  const onLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      addToast({
        title: 'Logout failed',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen overflow-y-auto bg-white"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-[24px] py-[6px]">
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="light"
            onPress={onBack}
            className="text-gray-600"
            startContent={<ChevronLeftIcon className="size-4" />}
          >
            Back
          </Button>
        </div>
        {/* 加一个 logout 按钮 */}
        <Button
          size="sm"
          variant="light"
          onPress={onLogout}
          className="text-gray-600"
        >
          Log Out
        </Button>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-12">
        {/* Style Section */}
        <div id="style-section" className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Style</h2>
          <p className="mb-6 text-gray-500">
            Choose a tone for your content, or paste links to match a custom
            style.
          </p>

          {/* Style Options */}
          <div className="mb-6 flex justify-center gap-4">
            {STYLE_OPTIONS.map((option) => {
              const isYourStyleDisabled =
                option.value === 'YourStyle' && !hasTweetData;

              return isYourStyleDisabled ? (
                <Tooltip
                  key={option.value}
                  content="Unable to learn style without past tweets"
                  placement="top"
                  classNames={{
                    content: 'bg-black text-white',
                    arrow: 'bg-black border-black',
                  }}
                >
                  <Button
                    key={option.value}
                    variant="bordered"
                    className={`border-1 cursor-not-allowed rounded-[12px] px-6 py-3 opacity-30 hover:opacity-30 `}
                    disabled={true}
                    onPress={() => handleStyleSelect(option.value)}
                  >
                    {option.label}
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  key={option.value}
                  variant="bordered"
                  className={`border-1 rounded-[12px] px-6 py-3 ${
                    selectedStyle === option.value
                      ? 'border-[#448AFF] bg-[#DDE9FF]  text-blue-600'
                      : isYourStyleDisabled
                        ? 'cursor-not-allowed border-gray-200 text-gray-400 opacity-50'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  } ${option.value === 'Customized' ? 'underline' : ''}`}
                  onPress={() => handleStyleSelect(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>

          {userStyleSummary && selectedStyle === 'YourStyle' && (
            <div
              className={cn(
                'rounded-lg p-4 text-[16px] leading-[1.4] text-gray-600',
              )}
            >
              <p className="whitespace-pre-line">{userStyleSummary}</p>
            </div>
          )}

          {selectedStyle !== 'YourStyle' &&
            selectedStyle !== 'Customized' &&
            SUMMARY_MAP[selectedStyle!] && (
              <div
                className={cn(
                  'rounded-lg p-4 text-[16px] leading-[1.4] text-gray-600',
                )}
              >
                <p className="whitespace-pre-line">
                  {SUMMARY_MAP[selectedStyle!]}
                </p>
              </div>
            )}

          {/* Custom Style Links - 只在选择 Customized 时显示 */}
          <div
            className={cn(
              'mb-6',
              selectedStyle === 'Customized' ? 'block' : 'hidden',
            )}
          >
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Examples of Customized Style
            </h3>
            <p className="mb-4 text-gray-500">
              Paste the link to the posts you'd like to use as style references.
            </p>
            <div className="flex justify-between gap-[10px]">
              {tweetExampleUrls.map((url, index) => {
                const validationResult = isValidUrl(url);
                const isInvalid =
                  url.trim() !== '' && validationResult !== true;
                const errorMessage =
                  validationResult === 'invalid-url'
                    ? 'Please enter a valid URL'
                    : validationResult === 'not-twitter'
                      ? 'Please enter a Twitter/X post link'
                      : undefined;

                return (
                  <Input
                    key={index}
                    value={url}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder={
                      index === 0 ? 'https://x.com/influxy.ai...' : ''
                    }
                    variant="bordered"
                    className="flex-1"
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    startContent={
                      <Image
                        src="/icons/link.svg"
                        alt="Link"
                        width={20}
                        height={20}
                        className="pointer-events-none shrink-0 text-gray-400"
                      />
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Personal Introduction Section */}
        <div id="personal-introduction" className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Personal Introduction
          </h2>
          <p className="mb-6 text-gray-500">
            Introduce yourself in 100-300 words, using a first-person tone. This
            will help personalize your future content.
          </p>
          <Textarea
            value={personalIntro}
            onChange={(e) => setPersonalIntro(e.target.value)}
            placeholder={`Example: I’m a serial entrepreneur, currently focused on building AI tools for content creators. Previously, I worked as a product manager at several major tech companies and spent time in VC doing early-stage investments. Later, I founded a project at the intersection of crypto and AI, which grew to over 7 million users. Now, I’m building an AI product designed to help creators save time and grow their influence. My account is positioned to share insights on AI trends, real-world startup lessons, and practical ways to use AI for efficient content creation and personal branding. My content style is honest and practical, aimed at entrepreneurs, AI enthusiasts, and anyone looking to leverage AI to boost their content game.`}
            rows={10}
            className="min-h-[260px] w-full"
            variant="bordered"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onPress={handleSubmit}
            isLoading={isLoading}
            className="rounded-full bg-black px-8 py-3 font-medium text-white"
          >
            {isLoading
              ? selectedStyle === 'Customized'
                ? 'Fetching tweets and saving...'
                : 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
