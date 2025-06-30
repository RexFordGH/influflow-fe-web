'use client';

// import { useAuthStore } from '@/stores/authStore';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useState, useEffect } from 'react';
import { EnhancedContentGeneration } from '@/components/content/EnhancedContentGeneration';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
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
    <div className="flex h-screen bg-gray-50">
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
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-6 w-6 text-gray-600" />
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
            <div className="group flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Campaigns</h3>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={createNewNote}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PlusIcon className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            <div className="space-y-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
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
                      className="w-full text-sm bg-transparent border-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="text-sm truncate"
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
      <div className="flex-1 flex flex-col">
        {!selectedNote ? (
          /* 欢迎界面 */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Hey Kelly, what would you like to write about today?
                {/* TODO: 恢复用户名动态显示 */}
                {/* Hey {isAuthenticated ? user?.name || 'there' : 'there'}, what would you like to write about today? */}
              </h2>

              <div className="mt-8 space-y-6">
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
                    className="w-full h-[120px] p-4 pr-12 rounded-2xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                    rows={4}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    className="absolute right-3 bottom-3 min-w-8 h-8 rounded-full"
                    onPress={handleTopicSubmit}
                    disabled={!topicInput.trim()}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 11L12 6L17 11M12 18V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform="rotate(90 12 12)"
                      />
                    </svg>
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="light"
                    onPress={handleWriteByMyself}
                    className="text-gray-700 hover:text-gray-900 underline text-base font-medium p-0 h-auto bg-transparent"
                  >
                    Write by Myself
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 笔记内容区 */
          <div className="flex-1 p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedNote.title}
                </h1>
                <p className="text-gray-500 text-sm">
                  Created: {selectedNote.createdAt.toLocaleDateString()}
                </p>
              </div>

              {/* TODO: 在这里添加思维导图和文章内容的双栏布局 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[500px]">
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to your note: "{selectedNote.title}"
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Content editing interface will be implemented here
                  </p>
                  <div className="text-sm text-gray-400">
                    Note ID: {selectedNote.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
