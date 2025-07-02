'use client';

// import { useAuthStore } from '@/stores/authStore';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button, Image } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { EnhancedContentGeneration } from '@/components/content/EnhancedContentGeneration';
import { TrendingTopics } from '@/components/content/TrendingTopics';
import { ApiTest } from '@/components/test/ApiTest';

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
  // const { openLoginModal } = useAuthStore();
  const [showContentGeneration, setShowContentGeneration] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);

  useEffect(() => {
    console.log('Selected note changed:', selectedNote);
    console.log('Notes array:', notes);
  }, [selectedNote, notes]);

  const createNewNote = () => {
    // TODO: 恢复登录校验
    // if (!isAuthenticated) {
    //   openLoginModal();
    //   return;
    // }

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
    // TODO: 恢复登录校验
    // if (!isAuthenticated) {
    //   openLoginModal();
    //   return;
    // }

    if (topicInput.trim()) {
      setCurrentTopic(topicInput);
      setShowContentGeneration(true);
      setTopicInput('');
    }
  };

  const handleWriteByMyself = () => {
    // TODO: 恢复登录校验
    // if (!isAuthenticated) {
    //   openLoginModal();
    //   return;
    // }

    // TODO: 进入手动编辑模式
    console.log('Entering manual edit mode');
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

  // 如果正在显示内容生成页面
  if (showContentGeneration && currentTopic) {
    return (
      <EnhancedContentGeneration
        topic={currentTopic}
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* TODO: 恢复登录按钮条件显示 */}
      {/* {!isAuthenticated && (
        <div className="fixed top-0 w-full h-[50px] z-50 flex justify-between items-center px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <p className="text-[20px] font-bold leading-[1]">InfluFlow</p>
          <Button
            className="px-[24px] py-[6px] bg-[#448AFF] text-white rounded-[24px]"
            color="primary"
            variant="flat"
            onPress={openLoginModal}
          >
            Login
          </Button>
        </div>
      )} */}

      {/* 左侧导航栏 */}
      <div className="flex w-[320px] flex-col border-r border-gray-200 bg-white z-10">
        {/* 用户信息 */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <UserIcon className="size-6 text-gray-600" />
            <span className="font-medium text-gray-900">
              Kelly
              {/* TODO: 恢复用户状态显示 */}
              {/* {isAuthenticated ? user?.name || 'User' : 'Guest'} */}
            </span>
          </div>
        </div>

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="group mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Campaigns</h3>
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

      {/* 右侧主内容区 */}
      <div className="flex flex-1 flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedNote ? (
            <div className="relative w-full h-full">
              {/* 欢迎界面 - 第一屏 */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: showTrendingTopics ? -window.innerHeight : 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
                className="absolute inset-0 flex items-center justify-center bg-gray-50"
              >
                <div className="flex flex-col gap-[24px] px-[24px] text-center relative">
                  <h2 className="text-[24px] font-[600] text-black">
                    Hey Kelly, what would you like to write about today?
                    {/* TODO: 恢复用户名动态显示 */}
                    {/* Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what would you like to write about today? */}
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
                      className="h-[120px] w-full resize-none rounded-2xl border shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] border-gray-200 p-4 pr-12 text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                      rows={4}
                    />
                    <Button
                      isIconOnly
                      color="primary"
                      className="absolute bottom-[12px] right-[12px] w-[40px] h-[40px] min-w-auto rounded-full"
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
                      className="h-auto bg-transparent hover:bg-transparent p-0 text-base font-medium text-gray-700 underline hover:text-gray-900"
                    >
                      Write by Myself
                    </Button>
                  </div>
                </div>
                <div className="absolute bottom-[55px] left-0 right-0  flex justify-center">
                  <div
                    className="flex flex-col items-center cursor-pointer hover:opacity-70 hover:scale-105 transition-all duration-300"
                    onClick={handleScrollToTrending}
                  >
                    <Image
                      src="/icons/scroll.svg"
                      alt="scroll-down"
                      width={24}
                      height={24}
                    />
                    <span className="text-[18px] text-[#448AFF] font-[500]">
                      Scroll down to explore trending topics
                    </span>
                  </div>
                </div>
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
