'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';

interface ProfilePromptProps {
  onCustomize: () => void;
  onClose: () => void;
}

export const ProfilePrompt = ({ onCustomize, onClose }: ProfilePromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed right-4 top-4 z-50 flex max-w-80 items-center space-x-2 rounded-xl bg-blue-500 p-4 text-white shadow-lg"
    >
      <div className="flex-1">
        <p className="text-sm">
          系统检测到您尚未完善个人信息，是否现在去填写？
        </p>
      </div>
      <Button
        size="sm"
        variant="solid"
        className="bg-white font-medium text-blue-500"
        onPress={onCustomize}
      >
        立即填写
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onClose}
        className="text-white hover:bg-blue-600"
      >
        <XMarkIcon className="size-4" />
      </Button>
    </motion.div>
  );
};