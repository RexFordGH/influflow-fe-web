'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { motion } from 'framer-motion';

interface UpgradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeSuccessModal({
  isOpen,
  onClose,
}: UpgradeSuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        base: 'bg-white max-w-[560px]',
        header: 'border-b-0 p-6 pb-0',
        body: 'p-6 pt-4',
        closeButton: 'hidden',
      }}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-[20px] font-semibold text-black">
                Plan Updated
              </h2>
              <button
                onClick={onModalClose}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              >
                <XMarkIcon className="size-5 text-gray-500" />
              </button>
            </ModalHeader>

            <ModalBody className="p-6 pt-[40px]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="font-poppins text-[16px] leading-6 text-black">
                  Please check your account to confirm the result. If it doesn’t
                  match your expectation, go to{' '}
                  <span className="font-[600] italic">Manage Billing</span> for
                  details.
                </p>

                <p className="font-poppins text-[14px] italic text-gray-600">
                  Note: UnionPay cards may require extra verification in Manage
                  Billing.
                </p>
              </motion.div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
