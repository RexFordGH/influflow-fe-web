'use client';

import { useAuthStore } from '@/stores/authStore';
import {
  DocumentTextIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Button, cn, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { type SuggestedTopic, type TrendingTopic } from '@/types/api';

const EnhancedContentGeneration = dynamic(
  () =>
    import('@/components/content/EnhancedContentGeneration').then((mod) => ({
      default: mod.EnhancedContentGeneration,
    })),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    ),
    ssr: false,
  },
);

const TrendingTopics = dynamic(
  () =>
    import('@/components/content/TrendingTopics').then((mod) => ({
      default: mod.TrendingTopics,
    })),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    ),
    ssr: false,
  },
);

const WriteByMyselfPage = dynamic(
  () =>
    import('@/components/content/WriteByMyselfPage').then((mod) => ({
      default: mod.WriteByMyselfPage,
    })),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    ),
    ssr: false,
  },
);

interface Article {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  children: Article[];
  expanded: boolean;
  createdAt: Date;
}

interface Category {
  id: string;
  title: string;
  articles: Article[];
  expanded: boolean;
}

// 递归文章项组件
const ArticleItem = ({
  article,
  categoryId,
  level = 0,
  onToggleExpanded,
  onOpenEditor,
  onAddChild,
  editingArticleId,
  tempTitle,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTempTitleChange,
}: {
  article: Article;
  categoryId: string;
  level?: number;
  onToggleExpanded: (categoryId: string, articleId: string) => void;
  onOpenEditor: (categoryId: string, articleId: string) => void;
  onAddChild: (categoryId: string, parentId: string) => void;
  editingArticleId: string | null;
  tempTitle: string;
  onStartEditTitle: (categoryId: string, articleId: string) => void;
  onSaveTitle: (categoryId: string, articleId: string) => void;
  onCancelEdit: () => void;
  onTempTitleChange: (title: string) => void;
}) => {
  const hasChildren = article.children.length > 0;
  const indentClass = level > 0 ? `ml-${level * 4}` : '';

  return (
    <div className={`${indentClass}`}>
      <div className="min-h-[37px] group flex items-center justify-between px-2 py-1 hover:bg-[#E8E8E8] rounded-[8px]">
        <div className="flex items-center space-x-2 flex-1">
          {hasChildren && (
            <button
              onClick={() => onToggleExpanded(categoryId, article.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Image
                src={'/icons/arrowLeft.svg'}
                alt="arrow-right"
                width={24}
                height={24}
                className={`transition-transform ${article.expanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          <DocumentTextIcon className="size-4 text-gray-500" />
          {editingArticleId === article.id ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => onTempTitleChange(e.target.value)}
              onBlur={() => onSaveTitle(categoryId, article.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTitle(categoryId, article.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
              autoFocus
            />
          ) : (
            <button
              onClick={() => onOpenEditor(categoryId, article.id)}
              onDoubleClick={() => onStartEditTitle(categoryId, article.id)}
              className={`text-sm text-gray-700 hover:text-gray-900 truncate flex-1 text-left ${
                categoryId === 'welcome' ? 'cursor-default' : ''
              }`}
            >
              {article.title}
            </button>
          )}
        </div>
        {categoryId !== 'welcome' && (
          <button
            onClick={() => onAddChild(categoryId, article.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          >
            <PlusIcon className="size-3 text-gray-600" />
          </button>
        )}
      </div>
      {hasChildren && article.expanded && (
        <div className="ml-4">
          {article.children.map((child) => (
            <ArticleItem
              key={child.id}
              article={child}
              categoryId={categoryId}
              level={level + 1}
              onToggleExpanded={onToggleExpanded}
              onOpenEditor={onOpenEditor}
              onAddChild={onAddChild}
              editingArticleId={editingArticleId}
              tempTitle={tempTitle}
              onStartEditTitle={onStartEditTitle}
              onSaveTitle={onSaveTitle}
              onCancelEdit={onCancelEdit}
              onTempTitleChange={onTempTitleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const { user, isAuthenticated, checkAuthStatus } = useAuthStore();
  const [showContentGeneration, setShowContentGeneration] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  // 检查用户登录状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // localStorage 操作函数
  const saveCategoriesToStorage = (cats: Category[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('article-categories', JSON.stringify(cats));
    }
  };

  const loadCategoriesFromStorage = (): Category[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('article-categories');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return [];
  };

  // 初始化分类数据
  useEffect(() => {
    const storedCategories = loadCategoriesFromStorage();
    if (storedCategories.length === 0) {
      // 初始化默认分类
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

  const handleTopicSubmit = () => {
    if (!isAuthenticated) {
      setShowLoginPage(true);
      return;
    }

    if (topicInput.trim()) {
      setCurrentTopic(topicInput);
      setShowContentGeneration(true);
      setTopicInput('');
    }
  };

  const handleWriteByMyself = () => {
    if (!isAuthenticated) {
      setShowLoginPage(true);
      return;
    }

    // 创建新文章
    const articleId = `article-${Date.now()}`;
    const newArticle: Article = {
      id: articleId,
      title: 'Untitled',
      content: '# Untitled\n\n开始写你的文章...',
      children: [],
      expanded: false,
      createdAt: new Date(),
    };

    // 创建新的分类作为根目录
    const timestamp = new Date();
    const categoryTitle = `My Article ${timestamp.getHours()}:${timestamp.getMinutes()}`;
    const categoryId = `category-${Date.now()}`;
    
    const newCategory: Category = {
      id: categoryId,
      title: categoryTitle,
      articles: [newArticle], // 直接包含新文章
      expanded: true,
    };
    
    const updatedCategories = [...categories, newCategory];
    console.log('Creating new category and article:', { newCategory, newArticle, updatedCategories });
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);

    // 打开编辑器
    setCurrentArticle(newArticle);
    setShowMarkdownEditor(true);
  };

  const handleBackToHome = () => {
    setShowContentGeneration(false);
    setCurrentTopic('');
  };

  const handleScrollToTrending = () => {
    setShowTrendingTopics(true);
  };

  const handleBackFromTrending = () => {
    setShowTrendingTopics(false);
  };

  const handleTrendingTopicSelect = (topic: TrendingTopic | SuggestedTopic) => {
    // 先切回首页，然后填充输入框
    setShowTrendingTopics(false);
    // 延迟一点时间填充输入框，让动画更流畅
    setTimeout(() => {
      setTopicInput(topic.title);
    }, 400);
  };

  const handleTwitterLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Twitter login error:', error);
    }
  };

  const handleBackToMainPage = () => {
    setShowLoginPage(false);
  };

  // 文章管理函数
  const toggleCategoryExpanded = (categoryId: string) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat,
    );
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
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
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
  };

  const createNewArticle = (categoryId: string, parentId?: string) => {
    // Welcome 分类不允许添加新文章
    if (categoryId === 'welcome') return;

    const newArticle: Article = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '# Untitled\n\n开始写你的文章...',
      parentId,
      children: [],
      expanded: false,
      createdAt: new Date(),
    };

    const updatedCategories = categories.map((cat) => {
      if (cat.id === categoryId) {
        if (parentId) {
          // 添加为子文章
          const addToParent = (articles: Article[]): Article[] =>
            articles.map((article) =>
              article.id === parentId
                ? { ...article, children: [...article.children, newArticle] }
                : { ...article, children: addToParent(article.children) },
            );
          return { ...cat, articles: addToParent(cat.articles) };
        } else {
          // 添加为根文章
          return { ...cat, articles: [...cat.articles, newArticle] };
        }
      }
      return cat;
    });

    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
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
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
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
    // 检查是否是 Welcome 分类下的文章
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

    // Welcome 分类下的文章不允许编辑内容
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
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
  };

  // 编辑标题相关函数
  const startEditCategoryTitle = (categoryId: string) => {
    // Welcome 分类不允许编辑
    if (categoryId === 'welcome') return;

    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setTempTitle(category.title);
    }
  };

  const startEditArticleTitle = (categoryId: string, articleId: string) => {
    // Welcome 分类下的文章不允许编辑标题
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
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
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
    setCategories(updatedCategories);
    saveCategoriesToStorage(updatedCategories);
    setEditingArticleId(null);
    setTempTitle('');

    // 如果当前文章正在编辑中，也更新编辑器标题
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

  // 如果正在显示内容生成页面
  if (showContentGeneration && currentTopic) {
    return (
      <EnhancedContentGeneration
        topic={currentTopic}
        onBack={handleBackToHome}
      />
    );
  }

  // 如果正在显示登录页面
  if (showLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            {/* 品牌Logo区域 */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                Login to InfluFlow
              </h1>
              <p className="text-gray-600">
                Transform your ideas into posts in seconds.
              </p>
            </div>

            {/* 登录按钮 */}
            <div className="space-y-4">
              <Button
                className="h-12 w-full border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                startContent={
                  <svg className="size-5" viewBox="0 0 24 24" fill="#1DA1F2">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                }
                onPress={handleTwitterLogin}
              >
                Continue with Twitter
              </Button>
            </div>

            {/* 返回按钮 */}
            <div className="mt-6 text-center">
              <Button
                variant="light"
                onPress={handleBackToMainPage}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-screen overflow-hidden bg-gray-50')}>
      {!isAuthenticated && (
        <div className="fixed top-0 w-full h-[50px] z-50 flex justify-between items-center px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <p className="text-[20px] font-bold leading-[1]">InfluFlow</p>
          <Button
            className="px-[24px] py-[6px] bg-[#448AFF] text-white rounded-[24px]"
            color="primary"
            variant="flat"
            onPress={() => setShowLoginPage(true)}
          >
            Login
          </Button>
        </div>
      )}

      {/* 左侧导航栏 */}
      <AnimatePresence>
        {isAuthenticated && !sidebarCollapsed && (
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
            {/* 收起按钮 */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-4 right-3 z-20 text-gray-600 hover:text-gray-900"
            >
              <Image
                src={'/icons/doubleArrowRounded.svg'}
                alt="arrow-right"
                width={24}
                height={24}
              />
            </Button>

            {/* 用户信息 */}
            <div className=" p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isAuthenticated && user?.avatar ? (
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
                    {isAuthenticated ? user?.name || 'Kelly' : 'Guest'}
                  </span>
                </div>
                {/* {!sidebarCollapsed && isAuthenticated && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => logout()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </Button>
              )} */}
              </div>
            </div>

            {/* 导航内容 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* 分类列表 */}
                {categories.map((category) => (
                  <div key={category.id} className="">
                    <div className="group flex items-center justify-between min-h-[37px] hover:bg-[#E8E8E8] rounded-[8px]">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryExpanded(category.id)}
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
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={() => saveCategoryTitle(category.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter')
                                saveCategoryTitle(category.id);
                              if (e.key === 'Escape') cancelEdit();
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
                              startEditCategoryTitle(category.id)
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
                          onPress={() => createNewArticle(category.id)}
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
                            onToggleExpanded={toggleArticleExpanded}
                            onOpenEditor={openArticleEditor}
                            onAddChild={createNewArticle}
                            editingArticleId={editingArticleId}
                            tempTitle={tempTitle}
                            onStartEditTitle={startEditArticleTitle}
                            onSaveTitle={saveArticleTitle}
                            onCancelEdit={cancelEdit}
                            onTempTitleChange={setTempTitle}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New 按钮 */}
                <div
                  className="flex items-center space-x-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={createNewCategory}
                >
                  <PlusIcon className="size-4" />
                  <span>Add New</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右侧主内容区 */}
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
        {/* 左上角展开按钮 */}
        {isAuthenticated && sidebarCollapsed && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setSidebarCollapsed(false)}
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

        {/* 如果正在显示Markdown编辑器 */}
        {showMarkdownEditor && currentArticle ? (
          <WriteByMyselfPage
            onBack={() => {
              setShowMarkdownEditor(false);
              setCurrentArticle(null);
            }}
            initialContent={currentArticle.content}
            onSave={(content) => saveArticleContent(currentArticle.id, content)}
            title={currentArticle.title}
            readonly={(() => {
              // 检查当前文章是否属于 Welcome 分类
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
            {/* 欢迎界面 - 第一屏 */}
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
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTopicSubmit();
                      }
                    }}
                    className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                    rows={4}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    className="absolute bottom-[12px] right-[12px] size-[40px] min-w-0 rounded-full"
                    onPress={handleTopicSubmit}
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
                    onClick={handleWriteByMyself}
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
                    onClick={handleScrollToTrending}
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

            {/* Trending Topics组件 - 第二屏 */}
            <TrendingTopics
              isVisible={showTrendingTopics}
              onBack={handleBackFromTrending}
              onTopicSelect={handleTrendingTopicSelect}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
