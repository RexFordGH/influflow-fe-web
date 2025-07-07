'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { useArticleManagement } from '@/hooks/useArticleManagement';
import { useAuthStore } from '@/stores/authStore';

export default function Profile() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    categories,
    editingCategoryId,
    tempTitle,
    setTempTitle,
    toggleCategoryExpanded,
    startEditCategoryTitle,
    saveCategoryTitle,
    cancelEdit,
    createNewArticle,
    createNewCategory,
    toggleArticleExpanded,
    openArticleEditor,
    editingArticleId,
    startEditArticleTitle,
    saveArticleTitle,
  } = useArticleManagement();

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
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

      <div
        className={`flex-1 ${sidebarCollapsed ? 'ml-0' : 'ml-[320px]'} transition-all duration-300`}
      >
        <ProfilePage onBack={handleBackToHome} />
      </div>
    </div>
  );
}
