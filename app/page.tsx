'use client';

import { cn } from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { MainContent } from '@/components/home/MainContent';
import {
  AppSidebar,
  AppSidebarRef,
} from '@/components/layout/sidebar/AppSidebar';
import { SidebarItem } from '@/components/layout/sidebar/types/sidebar.types';
import { ProfileCompletePrompt } from '@/components/profile';
import { FakeOutline } from '@/components/Renderer/mock';
import { useAuthStore } from '@/stores/authStore';
import {
  type ContentFormat,
  type ITrendsRecommendTweet,
  type SuggestedTopic,
  type TrendingTopic,
} from '@/types/api';
import { Outline } from '@/types/outline';
import {
  isPromptDismissed,
  needsProfileCompletion,
  setPromptDismissed,
} from '@/utils/profileStorage';

const ArticleRenderer = dynamic(
  () =>
    import('@/components/Renderer/ArticleRenderer').then((mod) => ({
      default: mod.ArticleRenderer,
    })),
  {
    ssr: false,
  },
);

function HomeContent() {
  const {
    user,
    isAuthenticated,
    checkAuthStatus,
    syncProfileFromSupabase,
    openLoginModal,
    setAuthError,
  } = useAuthStore();
  const searchParams = useSearchParams();
  const [showContentGeneration, setShowContentGeneration] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasCreatedContentGeneration, setHasCreatedContentGeneration] =
    useState(false);
  const [showProfileCompletePrompt, setShowProfileCompletePrompt] =
    useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [initialData, setInitialData] = useState<Outline | undefined>(
    undefined,
  );
  const [contentFormat, setContentFormat] = useState<ContentFormat>('longform');
  const [selectedTweets, setSelectedTweets] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  // 侧边栏 ref
  const sidebarRef = useRef<AppSidebarRef | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 检查URL中的错误参数
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const decodedError = decodeURIComponent(error);
      setAuthError(decodedError);
      openLoginModal(decodedError);
      // 清理URL中的错误参数
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, setAuthError, openLoginModal]);

  // 重置 profile 检查状态当认证状态变化时
  useEffect(() => {
    setHasCheckedProfile(false);
  }, [isAuthenticated]);

  useEffect(() => {
    // 检查是否需要显示 profile 完善提示
    const checkProfileCompletion = async () => {
      if (isAuthenticated && user && !hasCheckedProfile) {
        try {
          // 先从 Supabase 拉取最新的 profile 数据并同步到 authStore
          await syncProfileFromSupabase();

          // 基于最新数据判断是否需要完善 profile
          const updatedUser = useAuthStore.getState().user;
          const needsCompletion = needsProfileCompletion(updatedUser);
          const isDismissed = isPromptDismissed();

          // 如果需要完善 profile 且用户还没有关闭过提示，则显示提示
          if (needsCompletion && !isDismissed) {
            setShowProfileCompletePrompt(true);
          }

          // 标记已经检查过，避免重复执行
          setHasCheckedProfile(true);
        } catch (error) {
          console.error('Failed to sync profile from Supabase:', error);

          // 如果同步失败，仍然基于当前用户数据进行判断
          const needsCompletion = needsProfileCompletion(user);
          const isDismissed = isPromptDismissed();

          if (needsCompletion && !isDismissed) {
            setShowProfileCompletePrompt(true);
          }

          // 即使失败也标记为已检查，避免无限重试
          setHasCheckedProfile(true);
        }
      }
    };

    // 延迟 2 秒再进行检查
    const timer = setTimeout(checkProfileCompletion, 2000);

    // 清理定时器
    return () => clearTimeout(timer);
  }, [isAuthenticated, syncProfileFromSupabase, hasCheckedProfile]);

  const handleTopicSubmit = (selectedContentFormat: ContentFormat) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (topicInput.trim()) {
      // 清除之前选择的笔记数据，确保重新生成新内容
      setInitialData(undefined);
      setContentFormat(selectedContentFormat);

      // 如果有选中的推文，将其链接附加到topic中
      let finalTopic = topicInput;
      if (selectedTweets.length > 0) {
        const tweetUrls = selectedTweets.map((tweet) => tweet.url).join(', ');
        finalTopic = `${topicInput}. Reference these popular posts: ${tweetUrls}`;
      }

      setCurrentTopic(finalTopic);
      setShowContentGeneration(true);
      setHasCreatedContentGeneration(true);
      setTopicInput('');
      setSelectedTweets([]); // 清除选中的推文
    }
  };

  const handleBackToHome = () => {
    setInitialData(undefined);
    setShowContentGeneration(false);
    setCurrentTopic('');
    setSelectedItemId(undefined); // 清除选中状态
    // 返回首页时重新拉取文章列表确保数据同步
    sidebarRef.current?.refresh();
  };

  const handleScrollToTrending = () => {
    setShowTrendingTopics(true);
  };

  const handleBackFromTrending = () => {
    setShowTrendingTopics(false);
  };

  const handleTrendingTopicSelect = (topic: TrendingTopic | SuggestedTopic) => {
    setShowTrendingTopics(false);
    setTimeout(() => {
      // TrendingTopic 使用 title 字段，SuggestedTopic 使用 topic 字段
      const topicText = 'title' in topic ? topic.title : topic.topic;
      setTopicInput(topicText);
    }, 350);
  };

  const handleTrendingTweetsSelect = (tweets: any[], topicTitle: string) => {
    // 只将topic标题设置到输入框
    setTopicInput(topicTitle);
    // 单独管理选中的推文
    setSelectedTweets(tweets);
  };

  const handleRemoveSelectedTweet = (indexToRemove: number) => {
    setSelectedTweets((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleTrendingSearchConfirm = (
    searchTerm: string,
    selectedTweets: ITrendsRecommendTweet[],
  ) => {
    // 将搜索词设置到输入框
    setTopicInput(searchTerm);
    // 管理选中的推文
    setSelectedTweets(selectedTweets);
  };

  const handleCloseProfileCompletePrompt = () => {
    setShowProfileCompletePrompt(false);
    setPromptDismissed(); // 记录用户已关闭提示
  };

  const handleTweetThreadClick = (tweetData: any) => {
    // 1. 将 TweetThread 格式转换为 Outline 格式
    const outlineData: Outline = {
      topic: tweetData.topic,
      content_format: tweetData.content_format || 'longform',
      nodes: tweetData.tweets, // 将 'tweets' 映射到 'nodes'
      total_tweets: tweetData.tweets.reduce(
        (acc: number, group: any) => acc + (group.tweets?.length || 0),
        0,
      ),
      id: tweetData.id,
      updatedAt: tweetData.updated_at ?? new Date(),
    };

    // 2. 设置 initialData 和 topic
    setInitialData(outlineData);
    setContentFormat(outlineData.content_format);
    setCurrentTopic(outlineData.topic || 'Tweet Thread');

    // 3. 切换视图
    setShowContentGeneration(true);
    setHasCreatedContentGeneration(true);
  };

  // 处理侧边栏列表项点击
  const handleSidebarItemClick = (item: SidebarItem) => {
    // 设置选中的项目ID
    setSelectedItemId(item.id);

    // 直接使用分页API已获取的完整数据
    if (item.tweetData) {
      handleTweetThreadClick(item.tweetData);
    } else {
      // 如果没有完整数据，使用简化数据作为回退
      const fallbackData = {
        id: item.id.replace('tweet-', ''),
        topic: item.title,
        content_format: 'longform',
        tweets: [],
        updated_at: item.updatedAt || item.createdAt,
        created_at: item.createdAt,
      };
      handleTweetThreadClick(fallbackData);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Profile Complete Prompt */}
      <ProfileCompletePrompt
        isVisible={showProfileCompletePrompt}
        onClose={handleCloseProfileCompletePrompt}
      />

      {/* Content Generation */}
      {hasCreatedContentGeneration && (
        <div
          className={cn(
            'absolute inset-0 z-40',
            showContentGeneration && currentTopic ? 'block' : 'hidden',
          )}
        >
          <ArticleRenderer
            topic={currentTopic}
            contentFormat={contentFormat}
            onBack={handleBackToHome}
            initialData={
              process.env.NEXT_PUBLIC_USE_FAKE_OUTLINE === 'true'
                ? FakeOutline
                : initialData
            }
            onDataUpdate={async () => {
              await sidebarRef.current?.refresh();
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          'flex h-screen overflow-hidden bg-gray-50',
          showContentGeneration && currentTopic ? 'hidden' : 'flex',
        )}
      >
        <AnimatePresence>
          <AppSidebar
            ref={sidebarRef}
            onItemClick={handleSidebarItemClick}
            selectedId={selectedItemId}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(true)}
          />
        </AnimatePresence>

        <MainContent
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(false)}
          showTrendingTopics={showTrendingTopics}
          onScrollToTrending={handleScrollToTrending}
          onBackFromTrending={handleBackFromTrending}
          onTrendingTopicSelect={handleTrendingTopicSelect}
          onTrendingTweetsSelect={handleTrendingTweetsSelect}
          onTrendingSearchConfirm={handleTrendingSearchConfirm}
          selectedTweets={selectedTweets}
          onRemoveSelectedTweet={handleRemoveSelectedTweet}
          topicInput={topicInput}
          onTopicInputChange={setTopicInput}
          onTopicSubmit={handleTopicSubmit}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div></div>}>
      <HomeContent />
    </Suspense>
  );
}
