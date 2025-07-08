'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    router.back();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`flex-1 transition-all duration-300`}>
        <ProfilePage onBack={handleBackToHome} />
      </div>
    </div>
  );
}
