'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ProfileCompletePromptProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfileCompletePrompt = ({ isVisible, onClose }: ProfileCompletePromptProps) => {
  const router = useRouter();

  const handleGoToProfile = () => {
    router.push('/profile');
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.4 
          }}
          className="fixed right-4 top-4 z-50 max-w-sm"
        >
          <div className="flex items-center space-x-3 rounded-2xl bg-blue-500 p-4 text-white shadow-xl">
            {/* 内容区域 */}
            <div className="flex-1">
              <p className="text-sm font-medium">
                Complete your profile to improve content quality.
              </p>
            </div>

            {/* GO 按钮 */}
            <Button
              size="sm"
              className="h-8 min-w-0 rounded-full bg-white px-4 py-1 font-semibold text-blue-500"
              onPress={handleGoToProfile}
            >
              GO
            </Button>

            {/* 关闭按钮 */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="size-8 min-w-0 text-white hover:bg-blue-600"
              onPress={onClose}
            >
              <XMarkIcon className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};