'use client';

import { useAuthStore } from '@/stores/authStore';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button, cn, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { ApiTest } from '@/components/test/ApiTest';
import { createClient } from '@/lib/supabase/client';

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

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  popularity: number;
}

interface SuggestedTopic {
  id: string;
  title: string;
}

export default function Home() {
  const { user, isAuthenticated, checkAuthStatus, logout } = useAuthStore();
  const [showContentGeneration, setShowContentGeneration] = useState(false);
  const [showWriteByMyself, setShowWriteByMyself] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);

  useEffect(() => {
    console.log('Selected note changed:', selectedNote);
    console.log('Notes array:', notes);
  }, [selectedNote, notes]);

  // 检查用户登录状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const createNewNote = () => {
    if (!isAuthenticated) {
      setShowLoginPage(true);
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '',
      createdAt: new Date(),
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote);
    console.log('Created new note:', newNote);
  };

  const startEditTitle = (note: Note) => {
    setEditingTitle(note.id);
    setTempTitle(note.title);
  };

  const saveTitle = (noteId: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, title: tempTitle } : note,
      ),
    );
    setEditingTitle(null);
    if (selectedNote?.id === noteId) {
      setSelectedNote((prev) => (prev ? { ...prev, title: tempTitle } : null));
    }
  };

  const cancelEdit = () => {
    setEditingTitle(null);
    setTempTitle('');
  };

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

    setShowWriteByMyself(true);
  };

  const handleBackToHome = () => {
    setShowContentGeneration(false);
    setCurrentTopic('');
  };

  const handleBackFromWriteByMyself = () => {
    setShowWriteByMyself(false);
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

  // 如果正在显示内容生成页面
  if (showContentGeneration && currentTopic) {
    return (
      <EnhancedContentGeneration
        topic={currentTopic}
        onBack={handleBackToHome}
      />
    );
  }

  // 如果正在显示写作页面
  if (showWriteByMyself) {
    return <WriteByMyselfPage onBack={handleBackFromWriteByMyself} />;
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
      {isAuthenticated && (
        <div className="z-10 flex w-[320px] flex-col border-r border-gray-200 bg-white">
          {/* 用户信息 */}
          <div className="border-b border-gray-200 p-4">
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
                  {isAuthenticated ? user?.name || 'User' : 'Guest'}
                </span>
              </div>
              {isAuthenticated && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => logout()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* 笔记列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="group mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Welcome</h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={createNewNote}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <PlusIcon className="size-4 text-gray-600" />
                </Button>
              </div>

              <div className="space-y-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`cursor-pointer rounded p-2 transition-colors ${
                      selectedNote?.id === note.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    {editingTitle === note.id ? (
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={() => saveTitle(note.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(note.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full border-none bg-transparent text-sm outline-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="truncate text-sm"
                        onDoubleClick={() => startEditTitle(note)}
                      >
                        {note.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 右侧主内容区 */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedNote ? (
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
                className="absolute inset-0 flex items-center justify-center bg-gray-50"
              >
                <div className="relative flex flex-col gap-[24px] px-[24px] text-center">
                  <h2 className="text-[24px] font-[600] text-black">
                    Hey {isAuthenticated ? user?.name || 'there' : 'there'},
                    what would you like to write about today?
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
                    <Button
                      variant="light"
                      onPress={handleWriteByMyself}
                      className="h-auto bg-transparent p-0 text-base font-medium text-gray-700 underline hover:bg-transparent hover:text-gray-900"
                    >
                      Write by Myself
                    </Button>
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
          ) : (
            /* 笔记内容区 */
            <motion.div
              key="note-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-gray-50 p-6"
            >
              <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900">
                    {selectedNote.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Created: {selectedNote.createdAt.toLocaleDateString()}
                  </p>
                </div>

                {/* TODO: 在这里添加思维导图和文章内容的双栏布局 */}
                <div className="min-h-[500px] rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                  <div className="py-20 text-center">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Welcome to your note: "{selectedNote.title}"
                    </h3>
                    <p className="mb-6 text-gray-500">
                      Content editing interface will be implemented here
                    </p>
                    <div className="text-sm text-gray-400">
                      Note ID: {selectedNote.id}
                    </div>
                  </div>

                  {/* 临时API测试区域 */}
                  <div className="mt-8">
                    <ApiTest />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
