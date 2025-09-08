'use client';

import { cn } from '@heroui/react';

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute left-0 top-[50px] bottom-[0] z-[45] flex flex-col gap-2.5',
        'p-[24px] rounded-2xl bg-[#fcfcfc] rounded-[20px] mt-[6px] ml-3 mr-1.5 mb-3 w-[calc(50%-18px)]',
      )}
    >
      {/* 头部 */}
      {/* <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3"></div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-gray-200"
          aria-label="关闭对话"
        >
          <XMarkIcon className="size-5 text-gray-600" />
        </button>
      </div> */}

      {/* 内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
};
