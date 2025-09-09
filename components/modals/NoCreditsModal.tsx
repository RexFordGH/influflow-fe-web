'use client';

import { Button, Modal, ModalContent } from '@heroui/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface NoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoCreditsModal = ({ isOpen, onClose }: NoCreditsModalProps) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  const handleWait = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      hideCloseButton
      isDismissable={false}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'border-0 max-w-[560px]',
        body: 'p-0',
        header: 'p-0 border-0',
        footer: 'border-0',
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: 'easeIn',
            },
          },
        },
      }}
    >
      <ModalContent className="bg-white">
        <div className="flex w-[560px] flex-col gap-6 rounded-[20px] bg-white p-6 shadow-[0_0_15px_rgba(95,99,110,0.1)]">
          {/* Content */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {/* Title */}
                <h2 className="text-[20px] font-medium text-black">
                  No Credits Left
                </h2>
                {/* Description */}
                <p className="text-[16px] text-black">
                  Oops! You're out of credits. Please upgrade your plan or wait
                  for your next monthly reset.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="bordered"
                onPress={handleWait}
                className="h-10 rounded-[10px] border-gray-300 px-6 text-[16px] font-medium text-gray-600 hover:bg-gray-50"
              >
                I'll wait
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onPress={handleUpgrade}
                className="h-10 rounded-[10px] bg-[#448AFF] px-6 text-[16px] font-medium text-white hover:bg-[#3B7CE6]"
              >
                Upgrade
              </Button>
            </motion.div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default NoCreditsModal;
