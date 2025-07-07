'use client';

import { cn } from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { LoginPage } from '@/components/home/LoginPage';
import { MainContent } from '@/components/home/MainContent';
import { Sidebar } from '@/components/home/Sidebar';
import { UnauthenticatedNavbar } from '@/components/home/UnauthenticatedNavbar';
import { ProfilePage, ProfilePrompt } from '@/components/profile';
import { useArticleManagement } from '@/hooks/useArticleManagement';
import { useAuthStore } from '@/stores/authStore';
import { type SuggestedTopic, type TrendingTopic } from '@/types/api';

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
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

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
    // 检查是否需要显示个人信息提示
    if (isAuthenticated && user) {
      const hasBasicInfo = user.name && user.name !== 'User';
      if (!hasBasicInfo) {
        setShowProfilePrompt(true);
      }
    }
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

  const handleOpenProfile = () => {
    setShowProfilePage(true);
    setShowProfilePrompt(false);
  };

  const handleCloseProfile = () => {
    setShowProfilePage(false);
  };

  const handleCloseProfilePrompt = () => {
    setShowProfilePrompt(false);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Profile Page */}
      {showProfilePage && (
        <ProfilePage onBack={handleCloseProfile} />
      )}

      {/* Profile Prompt */}
      {showProfilePrompt && (
        <ProfilePrompt 
          onCustomize={handleOpenProfile}
          onClose={handleCloseProfilePrompt}
        />
      )}

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
          <Sidebar
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
            onOpenProfile={handleOpenProfile}
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
