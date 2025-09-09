'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@heroui/react';
import { motion } from 'framer-motion';

interface CustomPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomPlanModal({
  isOpen,
  onClose,
}: CustomPlanModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      classNames={{
        wrapper: 'z-[200]',
        backdrop: 'bg-black/50 backdrop-blur-sm z-[199]',
        base: 'bg-white rounded-[24px] shadow-lg max-w-[560px]',
        header: 'border-b-0 px-8 pt-8 pb-0',
        body: 'px-8 pb-8 pt-[40px]',
        closeButton: 'hidden',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <h2 className="text-[20px] font-medium text-black">
                Customize Your Plan
              </h2>
              <Button
                isIconOnly
                aria-label="Close"
                variant="light"
                size="sm"
                onPress={onClose}
                className="min-h-unit-8 min-w-unit-8 rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </Button>
            </ModalHeader>
            <ModalBody>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className=""
              >
                <p className="font-poppins text-[16px]">
                  👉 We offer tailored solutions for teams and professionals
                  with specific needs.
                </p>
                <p className=" text-black font-poppins text-[16px]">
                  👉 Contact us at:{' '}
                  <a
                    href="mailto:official@influxy.xyz"
                    className="text-black underline transition-opacity hover:opacity-70"
                  >
                    official@influxy.xyz
                  </a>
                </p>
              </motion.div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
