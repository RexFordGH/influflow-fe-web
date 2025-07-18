'use client';

import { cn } from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { MainContent } from '@/components/home/MainContent';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProfileCompletePrompt } from '@/components/profile';
import { useArticleManagement } from '@/hooks/useArticleManagement';
import { useAuthStore } from '@/stores/authStore';
import {
  type ContentFormat,
  type SuggestedTopic,
  type TrendingTopic,
} from '@/types/api';
import { Outline } from '@/types/outline';
import {
  isPromptDismissed,
  needsProfileCompletion,
  setPromptDismissed,
} from '@/utils/profileStorage';

const EnhancedContentGeneration = dynamic(
  () =>
    import('@/components/content/EnhancedContentGeneration').then((mod) => ({
      default: mod.EnhancedContentGeneration,
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

  const {
    categories,
    currentArticle,
    showMarkdownEditor,
    editingCategoryId,
    editingArticleId,
    tempTitle,
    tweetThreadsLoading,
    setTempTitle,
    setShowMarkdownEditor,
    setCurrentArticle,
    toggleCategoryExpanded,
    toggleArticleExpanded,
    createNewArticle,
    createNewCategory,
    openArticleEditor,
    saveArticleContent,
    startEditCategoryTitle,
    startEditArticleTitle,
    saveCategoryTitle,
    saveArticleTitle,
    cancelEdit,
    handleWriteByMyself,
    refetchTweetThreads,
  } = useArticleManagement();

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
      setCurrentTopic(topicInput);
      setShowContentGeneration(true);
      setHasCreatedContentGeneration(true);
      setTopicInput('');
    }
  };

  const handleBackToHome = () => {
    setInitialData(undefined);
    setShowContentGeneration(false);
    setCurrentTopic('');
    // 返回首页时重新拉取文章列表确保数据同步
    refetchTweetThreads();
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
    };

    // 2. 设置 initialData 和 topic
    setInitialData(outlineData);
    setContentFormat(outlineData.content_format);
    setCurrentTopic(outlineData.topic || 'Tweet Thread');

    // 3. 切换视图
    setShowContentGeneration(true);
    setHasCreatedContentGeneration(true);
  };

  const handleAddNewClick = () => {
    // 点击 Add New 返回主页面
    setShowContentGeneration(false);
    setShowMarkdownEditor(false);
    setCurrentArticle(null);
    setCurrentTopic('');
  };

  // 页面 focus 时刷新数据
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (isAuthenticated && !showContentGeneration) {
  //       // 只在用户已登录且在首页时刷新
  //       refetchTweetThreads();
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [isAuthenticated, showContentGeneration, refetchTweetThreads]);

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
          <EnhancedContentGeneration
            topic={currentTopic}
            contentFormat={contentFormat}
            onBack={handleBackToHome}
            initialData={initialData}
            onDataUpdate={refetchTweetThreads}
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
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            categories={categories}
            editingCategoryId={editingCategoryId}
            tempTitle={tempTitle}
            onToggleCategoryExpanded={toggleCategoryExpanded}
            onStartEditCategoryTitle={startEditCategoryTitle}
            onSaveCategoryTitle={saveCategoryTitle}
            onCancelEdit={cancelEdit}
            onTempTitleChange={setTempTitle}
            onCreateNewArticle={createNewArticle}
            onCreateNewCategory={createNewCategory}
            onToggleArticleExpanded={toggleArticleExpanded}
            onOpenArticleEditor={openArticleEditor}
            editingArticleId={editingArticleId}
            onStartEditArticleTitle={startEditArticleTitle}
            onSaveArticleTitle={saveArticleTitle}
            onTweetThreadClick={handleTweetThreadClick}
            onAddNewClick={handleAddNewClick}
            tweetThreadsLoading={tweetThreadsLoading}
          />
        </AnimatePresence>

        <MainContent
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(false)}
          showMarkdownEditor={showMarkdownEditor}
          currentArticle={currentArticle}
          categories={categories}
          onBackFromEditor={() => {
            setShowMarkdownEditor(false);
            setCurrentArticle(null);
          }}
          onSaveArticleContent={saveArticleContent}
          showTrendingTopics={showTrendingTopics}
          onScrollToTrending={handleScrollToTrending}
          onBackFromTrending={handleBackFromTrending}
          onTrendingTopicSelect={handleTrendingTopicSelect}
          topicInput={topicInput}
          onTopicInputChange={setTopicInput}
          onTopicSubmit={handleTopicSubmit}
          onWriteByMyself={handleWriteByMyself}
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
