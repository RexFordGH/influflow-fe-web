'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import EditorPro from '@/components/editorPro';

interface WriteByMyselfPageProps {
  onBack: () => void;
}

export const WriteByMyselfPage = ({ onBack }: WriteByMyselfPageProps) => {
  const [value, setValue] = useState('');

  const handleContentChange = (content: string) => {
    setValue(content);
    // 这里可以添加自动保存逻辑
    console.log('Content changed:', content);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex h-screen flex-col bg-gray-50"
      >
        {/* 顶部工具栏 */}
        <div className="flex items-center gap-4 border-b border-gray-200 bg-white p-4 shadow-sm">
          <Button
            isIconOnly
            variant="flat"
            onPress={onBack}
            className="shrink-0"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full">
            <EditorPro
              value={value}
              onChange={handleContentChange}
              className={{
                base: 'flex h-full flex-col',
                editorWrapper: 'min-h-0 flex-1',
                editor: 'h-full',
              }}
              placeholder="start writing..."
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
