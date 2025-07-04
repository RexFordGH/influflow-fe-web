
'use client';

import { useAuthStore } from '@/stores/authStore';
import { cn } from '@heroui/react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { type SuggestedTopic, type TrendingTopic } from '@/types/api';
import { LoginPage } from '@/components/home/LoginPage';
import { Sidebar } from '@/components/home/Sidebar';
import { MainContent } from '@/components/home/MainContent';
import { UnauthenticatedNavbar } from '@/components/home/UnauthenticatedNavbar';
import { useArticleManagement } from '@/hooks/useArticleManagement';

const EnhancedContentGeneration = dynamic(
  () =>
    import('@/components/content/EnhancedContentGeneration').then((mod) => ({
      default: mod.EnhancedContentGeneration,
    })),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    ),
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

  const handleTopicSubmit = () => {
    if (!isAuthenticated) {
      setShowLoginPage(true);
      return;
    }

    if (topicInput.trim()) {
      setCurrentTopic(topicInput);
      setShowContentGeneration(true);
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

  if (showContentGeneration && currentTopic) {
    return (
      <EnhancedContentGeneration
        topic={currentTopic}
        onBack={handleBackToHome}
      />
    );
  }

  if (showLoginPage) {
    return <LoginPage onBack={handleBackToMainPage} />;
  }

  return (
    <div className={cn('flex h-screen overflow-hidden bg-gray-50')}>
      {!isAuthenticated && <UnauthenticatedNavbar onLogin={() => setShowLoginPage(true)} />}

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
  );
}
