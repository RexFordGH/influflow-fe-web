'use client';

import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/authStore';
import { Category } from '@/types/content';

import { ArticleItem } from '../home/ArticleItem';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  categories: Category[];
  editingCategoryId: string | null;
  tempTitle: string;
  onToggleCategoryExpanded: (id: string) => void;
  onStartEditCategoryTitle: (id: string) => void;
  onSaveCategoryTitle: (id: string) => void;
  onCancelEdit: () => void;
  onTempTitleChange: (title: string) => void;
  onCreateNewArticle: (categoryId: string, parentId?: string) => void;
  onCreateNewCategory: () => void;
  onToggleArticleExpanded: (categoryId: string, articleId: string) => void;
  onOpenArticleEditor: (categoryId: string, articleId: string) => void;
  editingArticleId: string | null;
  onStartEditArticleTitle: (categoryId: string, articleId: string) => void;
  onSaveArticleTitle: (categoryId: string, articleId: string) => void;
}

export const AppSidebar = ({
  collapsed,
  onToggle,
  categories,
  editingCategoryId,
  tempTitle,
  onToggleCategoryExpanded,
  onStartEditCategoryTitle,
  onSaveCategoryTitle,
  onCancelEdit,
  onTempTitleChange,
  onCreateNewArticle,
  onCreateNewCategory,
  onToggleArticleExpanded,
  onOpenArticleEditor,
  editingArticleId,
  onStartEditArticleTitle,
  onSaveArticleTitle,
}: AppSidebarProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleOpenProfile = () => {
    router.push('/profile');
  };

  if (!isAuthenticated || collapsed) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className="fixed left-0 top-0 z-10 flex h-screen w-[320px] flex-col border-r border-gray-200 bg-[#FAFAFA]"
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onToggle}
        className="absolute right-3 top-4 z-20 text-gray-600 hover:text-gray-900"
      >
        <Image
          src={'/icons/doubleArrowRounded.svg'}
          alt="arrow-right"
          width={24}
          height={24}
        />
      </Button>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div
            className="-m-2 flex cursor-pointer items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
            onClick={handleOpenProfile}
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt="User Avatar"
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <UserIcon className="size-6 text-gray-600" />
            )}
            <span className="font-medium text-gray-900">
              {user?.name || 'Kelly'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {categories.map((category) => (
            <div key={category.id} className="">
              <div className="group flex min-h-[37px] items-center justify-between rounded-[8px] hover:bg-[#E8E8E8]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleCategoryExpanded(category.id)}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    <Image
                      src={'/icons/arrowLeft.svg'}
                      alt="arrow-right"
                      width={24}
                      height={24}
                      className={`transition-transform ${
                        category.expanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {editingCategoryId === category.id ? (
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => onTempTitleChange(e.target.value)}
                      onBlur={() => onSaveCategoryTitle(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveCategoryTitle(category.id);
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                      className="rounded border-none bg-transparent px-1 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className={`text-sm font-medium text-gray-900 ${
                        category.id !== 'welcome' ? 'cursor-pointer' : ''
                      }`}
                      onDoubleClick={() =>
                        onStartEditCategoryTitle(category.id)
                      }
                    >
                      {category.title}
                    </h3>
                  )}
                </div>
                {category.id !== 'welcome' && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onCreateNewArticle(category.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <PlusIcon className="size-4 text-gray-600" />
                  </Button>
                )}
              </div>

              {category.expanded && (
                <div className="ml-2 space-y-1">
                  {category.articles.map((article) => (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      categoryId={category.id}
                      onToggleExpanded={onToggleArticleExpanded}
                      onOpenEditor={onOpenArticleEditor}
                      onAddChild={onCreateNewArticle}
                      editingArticleId={editingArticleId}
                      tempTitle={tempTitle}
                      onStartEditTitle={onStartEditArticleTitle}
                      onSaveTitle={onSaveArticleTitle}
                      onCancelEdit={onCancelEdit}
                      onTempTitleChange={onTempTitleChange}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          <div
            className="flex cursor-pointer items-center space-x-2 p-2 text-sm text-gray-400 hover:text-gray-600"
            onClick={onCreateNewCategory}
          >
            <PlusIcon className="size-4" />
            <span>Add New</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
