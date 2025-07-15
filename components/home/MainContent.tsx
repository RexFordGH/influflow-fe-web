'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { Suspense, lazy } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { SuggestedTopic, TrendingTopic, ContentFormat } from '@/types/api';
import { Article, Category } from '@/types/content';

import { WelcomeScreen } from './WelcomeScreen';

const WriteByMyselfPage = lazy(() =>
  import('@/components/content/WriteByMyselfPage').then((module) => ({
    default: module.WriteByMyselfPage,
  })),
);

export const MainContent = ({
  sidebarCollapsed,
  onToggleSidebar,
  showMarkdownEditor,
  currentArticle,
  categories,
  onBackFromEditor,
  onSaveArticleContent,
  showTrendingTopics,
  onScrollToTrending,
  onBackFromTrending,
  onTrendingTopicSelect,
  topicInput,
  onTopicInputChange,
  onTopicSubmit,
  onWriteByMyself,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  showMarkdownEditor: boolean;
  currentArticle: Article | null;
  categories: Category[];
  onBackFromEditor: () => void;
  onSaveArticleContent: (articleId: string, content: string) => void;
  showTrendingTopics: boolean;
  onScrollToTrending: () => void;
  onBackFromTrending: () => void;
  onTrendingTopicSelect: (topic: TrendingTopic | SuggestedTopic) => void;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicSubmit: (contentFormat: ContentFormat) => void;
  onWriteByMyself: () => void;
}) => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      animate={{
        marginLeft: isAuthenticated && !sidebarCollapsed ? 320 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      {isAuthenticated && sidebarCollapsed && (
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onToggleSidebar}
          className="absolute left-4 top-4 z-50 bg-white text-gray-600 shadow-md hover:text-gray-900"
        >
          <Image
            src={'/icons/doubleArrowRounded.svg'}
            alt="arrow-right"
            width={24}
            height={24}
            className="pointer-events-none -scale-x-100"
          />
        </Button>
      )}

      <div className="size-full" hidden={showMarkdownEditor}>
        <WelcomeScreen
          showTrendingTopics={showTrendingTopics}
          onScrollToTrending={onScrollToTrending}
          onBackFromTrending={onBackFromTrending}
          onTrendingTopicSelect={onTrendingTopicSelect}
          topicInput={topicInput}
          onTopicInputChange={onTopicInputChange}
          onTopicSubmit={onTopicSubmit}
          onWriteByMyself={onWriteByMyself}
        />
      </div>

      <div className="size-full" hidden={!showMarkdownEditor}>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center text-gray-500">
              Loading Editor...
            </div>
          }
        >
          <WriteByMyselfPage
            onBack={onBackFromEditor}
            initialContent={currentArticle?.content || ''}
            onSave={(content) => {
              if (currentArticle) {
                onSaveArticleContent(currentArticle.id, content);
              }
            }}
            title={currentArticle?.title || ''}
            readonly={
              currentArticle
                ? (() => {
                    for (const category of categories) {
                      if (category.id === 'welcome') {
                        const findArticle = (articles: Article[]): boolean => {
                          for (const article of articles) {
                            if (article.id === currentArticle.id) return true;
                            if (findArticle(article.children)) return true;
                          }
                          return false;
                        };
                        if (findArticle(category.articles)) return true;
                      }
                    }
                    return false;
                  })()
                : false
            }
          />
        </Suspense>
      </div>
    </motion.div>
  );
};
