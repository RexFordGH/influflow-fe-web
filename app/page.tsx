'use client';

import { cn } from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { LoginPage } from '@/components/home/LoginPage';
import { MainContent } from '@/components/home/MainContent';
import { UnauthenticatedNavbar } from '@/components/home/UnauthenticatedNavbar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProfileCompletePrompt } from '@/components/profile';
import { useArticleManagement } from '@/hooks/useArticleManagement';
import { useAuthStore } from '@/stores/authStore';
import { type SuggestedTopic, type TrendingTopic } from '@/types/api';
import { needsProfileCompletion, isPromptDismissed, setPromptDismissed } from '@/utils/profileStorage';

const EnhancedContentGeneration = dynamic(
  () =>
    import('@/components/content/EnhancedContentGeneration').then((mod) => ({
      default: mod.EnhancedContentGeneration,
    })),
  {
    ssr: false,
  },
);

export default function Home() {
  const { user, isAuthenticated, checkAuthStatus } = useAuthStore();
  const [showContentGeneration, setShowContentGeneration] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasCreatedContentGeneration, setHasCreatedContentGeneration] =
    useState(false);
  const [showProfileCompletePrompt, setShowProfileCompletePrompt] = useState(false);

  const {
    categories,
    currentArticle,
    showMarkdownEditor,
    editingCategoryId,
    editingArticleId,
    tempTitle,
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
  } = useArticleManagement();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    // 检查是否需要显示 profile 完善提示
    const checkProfileCompletion = () => {
      if (isAuthenticated && user) {
        const needsCompletion = needsProfileCompletion(user);
        const isDismissed = isPromptDismissed();
        
        // 如果需要完善 profile 且用户还没有关闭过提示，则显示提示
        if (needsCompletion && !isDismissed) {
          setShowProfileCompletePrompt(true);
        }
      }
    };

    // 延迟 2 秒再进行检查
    const timer = setTimeout(checkProfileCompletion, 2000);
    
    // 清理定时器
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const handleTopicSubmit = () => {
    if (!isAuthenticated) {
      setShowLoginPage(true);
      return;
    }

    if (topicInput.trim()) {
      setCurrentTopic(topicInput);
      setShowContentGeneration(true);
      setHasCreatedContentGeneration(true);
      setTopicInput('');
    }
  };

  const handleBackToHome = () => {
    setShowContentGeneration(false);
    setCurrentTopic('');
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
      setTopicInput(topic.title);
    }, 400);
  };

  const handleBackToMainPage = () => {
    setShowLoginPage(false);
  };

  const handleCloseProfileCompletePrompt = () => {
    setShowProfileCompletePrompt(false);
    setPromptDismissed(); // 记录用户已关闭提示
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Profile Complete Prompt */}
      <ProfileCompletePrompt
        isVisible={showProfileCompletePrompt}
        onClose={handleCloseProfileCompletePrompt}
      />

      {/* Login Page */}
      <div
        className={cn(
          'absolute inset-0 z-50',
          showLoginPage ? 'block' : 'hidden',
        )}
      >
        <LoginPage onBack={handleBackToMainPage} />
      </div>

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
            onBack={handleBackToHome}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          'flex h-screen overflow-hidden bg-gray-50',
          (showContentGeneration && currentTopic) || showLoginPage
            ? 'hidden'
            : 'flex',
        )}
      >
        {!isAuthenticated && (
          <UnauthenticatedNavbar onLogin={() => setShowLoginPage(true)} />
        )}

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
