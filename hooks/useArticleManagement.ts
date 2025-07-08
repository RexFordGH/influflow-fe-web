'use client';

import { useTweetThreads } from '@/hooks/useTweetThreads';
import { useAuthStore } from '@/stores/authStore';
import { Article, Category } from '@/types/content';
import { useCallback, useEffect, useState } from 'react';

export const useArticleManagement = () => {
  const { user } = useAuthStore();
  const { tweetThreads, loading: tweetThreadsLoading, refetch: refetchTweetThreads } = useTweetThreads(user?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    const defaultCategories: Category[] = [
      {
        id: 'welcome',
        title: 'Welcome',
        expanded: true,
        articles: [
          {
            id: 'how-to-use',
            title: 'How to Use InfluNotes',
            content:
              '# How to Use InfluNotes\n\n欢迎使用 InfluNotes！这是一个强大的文章编辑和管理工具。',
            children: [],
            expanded: false,
            createdAt: new Date(),
          },
          {
            id: 'why-built',
            title: 'Why we Built this app',
            content:
              '# Why we Built this app\n\n我们构建这个应用是为了帮助用户更好地管理和编辑他们的文章内容。',
            children: [],
            expanded: false,
            createdAt: new Date(),
          },
        ],
      },
    ];
    setCategories(defaultCategories);
  }, []);

  // 将 tweet_thread 数据合并到 categories 中
  useEffect(() => {
    if (tweetThreads.length > 0) {
      const tweetCategories: Category[] = tweetThreads.map((thread) => ({
        id: `tweet-${thread.id}`,
        title: thread.topic || 'Untitled Thread',
        expanded: false,
        articles: [], // 不展示子文章，只显示 topic
        tweetData: thread, // 保存原始 tweet 数据
      }));

      // 合并默认分类和 tweet 分类
      setCategories((prevCategories) => {
        // 过滤掉之前的 tweet 分类
        const nonTweetCategories = prevCategories.filter(
          (cat) => !cat.id.startsWith('tweet-'),
        );
        // 添加新的 tweet 分类
        return [...nonTweetCategories, ...tweetCategories];
      });
    }
  }, [tweetThreads]);

  const updateCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
  }, []);

  const toggleCategoryExpanded = (categoryId: string) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat,
    );
    updateCategories(updatedCategories);
  };

  const toggleArticleExpanded = (categoryId: string, articleId: string) => {
    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoryId) {
        const updateArticle = (articles: Article[]): Article[] =>
          articles.map((article) =>
            article.id === articleId
              ? { ...article, expanded: !article.expanded }
              : { ...article, children: updateArticle(article.children) },
          );
        return { ...cat, articles: updateArticle(cat.articles) };
      }
      return cat;
    });
    updateCategories(updatedCategories);
  };

  const createNewArticle = (categoryId: string, parentId?: string) => {
    if (categoryId === 'welcome' || categoryId.startsWith('tweet-')) return;

    const newArticle: Article = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '# Untitled\n\n开始写你的文章...',
      children: [],
      expanded: false,
      createdAt: new Date(),
    };

    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoryId) {
        if (parentId) {
          const addToParent = (articles: Article[]): Article[] =>
            articles.map((article) =>
              article.id === parentId
                ? {
                    ...article,
                    children: [...article.children, newArticle],
                    expanded: true,
                  }
                : { ...article, children: addToParent(article.children) },
            );
          return { ...cat, articles: addToParent(cat.articles) };
        } else {
          return { ...cat, articles: [...cat.articles, newArticle] };
        }
      }
      return cat;
    });

    updateCategories(updatedCategories);
    setCurrentArticle(newArticle);
    setShowMarkdownEditor(true);
  };

  const createNewCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      title: 'New Category',
      articles: [],
      expanded: true,
    };
    const updatedCategories = [...categories, newCategory];
    updateCategories(updatedCategories);
  };

  const openArticleEditor = (categoryId: string, articleId: string) => {
    const findArticle = (articles: Article[]): Article | null => {
      for (const article of articles) {
        if (article.id === articleId) return article;
        const found = findArticle(article.children);
        if (found) return found;
      }
      return null;
    };

    for (const category of categories) {
      if (category.id === categoryId) {
        const article = findArticle(category.articles);
        if (article) {
          setCurrentArticle(article);
          setShowMarkdownEditor(true);
          return;
        }
      }
    }
  };

  const saveArticleContent = (articleId: string, content: string) => {
    let isWelcomeArticle = false;
    for (const category of categories) {
      if (category.id === 'welcome') {
        const findArticle = (articles: Article[]): boolean => {
          for (const article of articles) {
            if (article.id === articleId) return true;
            if (findArticle(article.children)) return true;
          }
          return false;
        };
        if (findArticle(category.articles)) {
          isWelcomeArticle = true;
          break;
        }
      }
    }

    if (isWelcomeArticle) return;

    const updatedCategories = categories.map((cat) => {
      const updateArticle = (articles: Article[]): Article[] =>
        articles.map((article) =>
          article.id === articleId
            ? { ...article, content }
            : { ...article, children: updateArticle(article.children) },
        );
      return { ...cat, articles: updateArticle(cat.articles) };
    });
    updateCategories(updatedCategories);
  };

  const startEditCategoryTitle = (categoryId: string) => {
    if (categoryId === 'welcome' || categoryId.startsWith('tweet-')) return;

    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setTempTitle(category.title);
    }
  };

  const startEditArticleTitle = (categoryId: string, articleId: string) => {
    if (categoryId === 'welcome' || categoryId.startsWith('tweet-')) return;

    const findArticle = (articles: Article[]): Article | null => {
      for (const article of articles) {
        if (article.id === articleId) return article;
        const found = findArticle(article.children);
        if (found) return found;
      }
      return null;
    };

    for (const category of categories) {
      if (category.id === categoryId) {
        const article = findArticle(category.articles);
        if (article) {
          setEditingArticleId(articleId);
          setTempTitle(article.title);
          return;
        }
      }
    }
  };

  const saveCategoryTitle = (categoryId: string) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, title: tempTitle } : cat,
    );
    updateCategories(updatedCategories);
    setEditingCategoryId(null);
    setTempTitle('');
  };

  const saveArticleTitle = (categoryId: string, articleId: string) => {
    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoryId) {
        const updateArticle = (articles: Article[]): Article[] =>
          articles.map((article) =>
            article.id === articleId
              ? { ...article, title: tempTitle }
              : { ...article, children: updateArticle(article.children) },
          );
        return { ...cat, articles: updateArticle(cat.articles) };
      }
      return cat;
    });
    updateCategories(updatedCategories);
    setEditingArticleId(null);
    setTempTitle('');

    if (currentArticle?.id === articleId) {
      setCurrentArticle((prev) =>
        prev ? { ...prev, title: tempTitle } : null,
      );
    }
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingArticleId(null);
    setTempTitle('');
  };

  const handleWriteByMyself = () => {
    const articleId = `article-${Date.now()}`;
    const newArticle: Article = {
      id: articleId,
      title: 'Untitled',
      content: '# Untitled\n\n开始写你的文章...',
      children: [],
      expanded: false,
      createdAt: new Date(),
    };

    const timestamp = new Date();
    const categoryTitle = `My Article ${timestamp.getHours()}:${timestamp.getMinutes()}`;
    const categoryId = `category-${Date.now()}`;

    const newCategory: Category = {
      id: categoryId,
      title: categoryTitle,
      articles: [newArticle],
      expanded: true,
    };

    const updatedCategories = [...categories, newCategory];
    updateCategories(updatedCategories);

    setCurrentArticle(newArticle);
    setShowMarkdownEditor(true);
  };

  return {
    categories,
    currentArticle,
    showMarkdownEditor,
    editingCategoryId,
    editingArticleId,
    tempTitle,
    tweetThreadsLoading,
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
    refetchTweetThreads, // 暴露刷新函数
  };
};
