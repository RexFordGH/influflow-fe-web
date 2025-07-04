
'use client';

import { Button, Image } from '@heroui/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { WriteByMyselfPage } from '@/components/content/WriteByMyselfPage';
import { TrendingTopics } from '@/components/content/TrendingTopics';
import { Article, Category } from '@/types/content';
import { SuggestedTopic, TrendingTopic } from '@/types/api';

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
  onTopicSubmit: () => void;
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
          className="absolute top-4 left-4 z-50 text-gray-600 hover:text-gray-900 bg-white shadow-md"
        >
          <Image
            src={'/icons/doubleArrowRounded.svg'}
            alt="arrow-right"
            width={24}
            height={24}
            className="pointer-events-none transform scale-x-[-1]"
          />
        </Button>
      )}

      {showMarkdownEditor && currentArticle ? (
        <WriteByMyselfPage
          onBack={onBackFromEditor}
          initialContent={currentArticle.content}
          onSave={(content) => onSaveArticleContent(currentArticle.id, content)}
          title={currentArticle.title}
          readonly={(() => {
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
          })()}
        />
      ) : (
        <div className="relative size-full">
          <motion.div
            initial={{ y: 0 }}
            animate={{
              y: showTrendingTopics
                ? typeof window !== 'undefined'
                  ? -window.innerHeight
                  : -800
                : 0,
            }}
            transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center bg-white"
          >
            <div className="relative flex flex-col gap-[24px] px-[24px] text-center">
              <h2 className="text-[24px] font-[600] text-black">
                Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what
                would you like to write about today?
              </h2>

              <div className="relative">
                <textarea
                  placeholder="You can start with a topic or an opinion."
                  value={topicInput}
                  onChange={(e) => onTopicInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onTopicSubmit();
                    }
                  }}
                  className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                  rows={4}
                />
                <Button
                  isIconOnly
                  color="primary"
                  className="absolute bottom-[12px] right-[12px] size-[40px] min-w-0 rounded-full"
                  onPress={onTopicSubmit}
                  disabled={!topicInput.trim()}
                >
                  <Image
                    src="/icons/send.svg"
                    alt="发送"
                    width={40}
                    height={40}
                    className="pointer-events-none"
                  />
                </Button>
              </div>

              <div className="text-center">
                <div
                  onClick={onWriteByMyself}
                  className="text-[16px] font-[500] text-black underline cursor-pointer hover:text-[#448AFF]"
                >
                  Write by Myself
                </div>
              </div>
            </div>
            {isAuthenticated && (
              <div className="absolute inset-x-0 bottom-[55px] flex  justify-center">
                <div
                  className="flex cursor-pointer flex-col items-center transition-all duration-300 hover:scale-105 hover:opacity-70"
                  onClick={onScrollToTrending}
                >
                  <Image
                    src="/icons/scroll.svg"
                    alt="scroll-down"
                    width={24}
                    height={24}
                  />
                  <span className="text-[18px] font-[500] text-[#448AFF]">
                    Scroll down to explore trending topics
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          <TrendingTopics
            isVisible={showTrendingTopics}
            onBack={onBackFromTrending}
            onTopicSelect={onTrendingTopicSelect}
          />
        </div>
      )}
    </motion.div>
  );
};
