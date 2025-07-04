
'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { UserIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { ArticleItem } from './ArticleItem';
import { Category, Article } from '@/types/content';

export const Sidebar = ({
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
}: {
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
}) => {
  const { user, isAuthenticated } = useAuthStore();

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
      className="z-10 flex w-[320px] flex-col border-r border-gray-200 bg-[#FAFAFA] fixed left-0 top-0 h-screen"
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onToggle}
        className="absolute top-4 right-3 z-20 text-gray-600 hover:text-gray-900"
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
          <div className="flex items-center space-x-2">
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
              <div className="group flex items-center justify-between min-h-[37px] hover:bg-[#E8E8E8] rounded-[8px]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleCategoryExpanded(category.id)}
                    className="p-1 hover:bg-gray-200 rounded"
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
                        if (e.key === 'Enter')
                          onSaveCategoryTitle(category.id);
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                      className="text-sm font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
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
            className="flex items-center space-x-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
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
