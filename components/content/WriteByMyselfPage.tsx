'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import EditorPro from '@/components/editorPro';

interface WriteByMyselfPageProps {
  onBack: () => void;
  initialContent?: string;
  onSave?: (content: string) => void;
  title?: string;
  readonly?: boolean;
}

export const WriteByMyselfPage = ({
  onBack,
  initialContent = '',
  onSave,
  title,
  readonly = false,
}: WriteByMyselfPageProps) => {
  const [value, setValue] = useState(initialContent);

  const handleContentChange = (content: string) => {
    setValue(content);
    // 自动保存逻辑 - 只读模式下不保存
    if (onSave && !readonly) {
      onSave(content);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex h-screen flex-col bg-white"
      >
        {/* 顶部工具栏 */}
        <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white p-4 shadow-sm">
          <Button
            isIconOnly
            variant="flat"
            onPress={onBack}
            className="shrink-0"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          {title && (
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-medium text-gray-900">
                {title}
              </h1>
              {readonly && (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                  只读
                </span>
              )}
            </div>
          )}
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 overflow-y-scroll p-4">
          <div className="">
            <EditorPro
              value={value}
              onChange={readonly ? undefined : handleContentChange}
              className={{
                base: 'flex flex-col ',
                menuBar: 'shrink-0',
                editorWrapper: 'flex-1 overflow-y-scroll',
                editor: ' ',
              }}
              placeholder={readonly ? '此文档为只读模式' : 'start writing...'}
              isEdit={!readonly}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
