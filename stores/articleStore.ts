import { SidebarItem } from '@/components/layout/sidebar/types/sidebar.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IArticleState {
  // 文章列表
  articles: SidebarItem[];
  // 当前选中的文章ID
  selectedArticleId: string | null;
  // 总数量
  total: number;
  // 是否还有更多数据
  hasMore: boolean;
  
  // Actions
  setArticles: (articles: SidebarItem[]) => void;
  appendArticles: (articles: SidebarItem[]) => void;
  updateArticle: (id: string, article: Partial<SidebarItem>) => void;
  removeArticle: (id: string) => void;
  setSelectedArticleId: (id: string | null) => void;
  setTotal: (total: number) => void;
  setHasMore: (hasMore: boolean) => void;
  getArticleById: (id: string) => SidebarItem | undefined;
  clearArticles: () => void;
}

export const useArticleStore = create<IArticleState>()(
  persist(
    (set, get) => ({
      articles: [],
      selectedArticleId: null,
      total: 0,
      hasMore: false,

      setArticles: (articles) =>
        set({
          articles,
        }),

      appendArticles: (newArticles) =>
        set((state) => ({
          articles: [...state.articles, ...newArticles],
        })),

      updateArticle: (id, articleUpdate) =>
        set((state) => ({
          articles: state.articles.map((article) =>
            article.id === id ? { ...article, ...articleUpdate } : article
          ),
        })),

      removeArticle: (id) =>
        set((state) => ({
          articles: state.articles.filter((article) => article.id !== id),
          selectedArticleId:
            state.selectedArticleId === id ? null : state.selectedArticleId,
        })),

      setSelectedArticleId: (id) =>
        set({
          selectedArticleId: id,
        }),

      setTotal: (total) =>
        set({
          total,
        }),

      setHasMore: (hasMore) =>
        set({
          hasMore,
        }),

      getArticleById: (id) => {
        const state = get();
        return state.articles.find((article) => article.id === `tweet-${id}`);
      },

      clearArticles: () =>
        set({
          articles: [],
          selectedArticleId: null,
          total: 0,
          hasMore: false,
        }),
    }),
    {
      name: 'article-storage',
      partialize: (state) => ({
        articles: state.articles,
        selectedArticleId: state.selectedArticleId,
      }),
    }
  )
);