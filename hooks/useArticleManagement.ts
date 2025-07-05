'use client';

import { Article, Category } from '@/types/content';
import { useCallback, useEffect, useState } from 'react';

const saveCategoriesToStorage = (cats: Category[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('article-categories', JSON.stringify(cats));
  }
};

const loadCategoriesFromStorage = (): Category[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('article-categories');
    if (stored) {
      try {
        // Properly parse dates, which are stored as strings
        const parsed = JSON.parse(stored);
        const restoreDates = (articles: Article[]): Article[] =>
          articles.map((article) => ({
            ...article,
            createdAt: new Date(article.createdAt),
            children: restoreDates(article.children),
          }));

        return parsed.map((category: Category) => ({
          ...category,
          articles: restoreDates(category.articles),
        }));
      } catch (e) {
        console.error('Failed to parse categories from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

export const useArticleManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    const storedCategories = loadCategoriesFromStorage();
    if (storedCategories.length === 0) {
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
        {
          id: 'campaigns',
          title: 'Campaigns',
          expanded: true,
          articles: [],
        },
      ];
      setCategories(defaultCategories);
      saveCategoriesToStorage(defaultCategories);
    } else {
      setCategories(storedCategories);
    }
  }, []);

  const updateCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
    saveCategoriesToStorage(newCategories);
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
    if (categoryId === 'welcome') return;

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
    if (categoryId === 'welcome') return;

    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setTempTitle(category.title);
    }
  };

  const startEditArticleTitle = (categoryId: string, articleId: string) => {
    if (categoryId === 'welcome') return;

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
  };
};
