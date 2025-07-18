'use client';

import {
  DocumentTextIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Button, Image, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/authStore';
import { Category } from '@/types/content';

import { ArticleItem } from '../home/ArticleItem';

const TweetThreadsSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="flex items-center space-x-2 p-2">
        <Skeleton className="size-6 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
    ))}
  </div>
);

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
  onTweetThreadClick?: (tweetData: any) => void;
  onAddNewClick?: () => void;
  tweetThreadsLoading?: boolean;
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
  onTweetThreadClick,
  onAddNewClick,
  tweetThreadsLoading = false,
}: AppSidebarProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleOpenProfile = () => {
    router.push('/profile');
  };

  const handleCategoryClick = (category: Category) => {
    if (
      category.id.startsWith('tweet-') &&
      category.tweetData &&
      onTweetThreadClick
    ) {
      // 点击 tweet 分类时，打开思维导图和 MD 区域
      // 确保使用最新的 tweetData
      onTweetThreadClick({ ...category.tweetData, timestamp: Date.now() });
    } else {
      // 普通分类的展开/收起
      onToggleCategoryExpanded(category.id);
    }
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
          {tweetThreadsLoading && categories.length === 0 ? (
            <TweetThreadsSkeleton />
          ) : (
            <>
              {categories.map((category) => (
                <div
                  key={`${category.id}-${category.tweetData?.updated_at || category.tweetData?.created_at || category.id}`}
                  className=""
                >
                  <div className="group flex min-h-[37px] items-center justify-between rounded-[8px] hover:bg-[#E8E8E8]">
                    <div className="flex items-center space-x-2">
                      {/* 使用不同图标区分普通分类和tweet内容 */}
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className="rounded p-1 hover:bg-gray-200"
                      >
                        {category.id.startsWith('tweet-') ? (
                          <DocumentTextIcon className="size-4 text-gray-500 opacity-70" />
                        ) : (
                          <Image
                            src="/icons/arrowLeft.svg"
                            alt="arrow icon"
                            width={24}
                            height={24}
                            className={`transition-transform ${
                              category.expanded ? 'rotate-90' : ''
                            }`}
                          />
                        )}
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
                          className="rounded border-none bg-transparent px-1 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <h3
                          className={`max-w-[250px] truncate text-sm font-medium text-gray-900 ${
                            category.id !== 'welcome' &&
                            !category.id.startsWith('tweet-')
                              ? 'cursor-pointer'
                              : category.id.startsWith('tweet-')
                                ? 'cursor-pointer'
                                : ''
                          }`}
                          onClick={() => {
                            if (category.id.startsWith('tweet-')) {
                              handleCategoryClick(category);
                            }
                          }}
                          onDoubleClick={() =>
                            onStartEditCategoryTitle(category.id)
                          }
                          title={category.title}
                        >
                          {category.title}
                        </h3>
                      )}
                    </div>
                    {category.id !== 'welcome' &&
                      !category.id.startsWith('tweet-') && (
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
                          key={`${article.id}-${article.createdAt.getTime()}`}
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

              {/* <div
                className="flex cursor-pointer items-center space-x-2 p-2 text-sm text-gray-400 hover:text-gray-600"
                onClick={onAddNewClick}
              >
                <PlusIcon className="size-4" />
                <span>Add New</span>
              </div> */}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
