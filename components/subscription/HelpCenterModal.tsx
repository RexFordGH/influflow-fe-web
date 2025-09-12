'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@heroui/react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCenterModal({
  isOpen,
  onClose,
}: HelpCenterModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="xl"
      classNames={{
        base: 'rounded-[20px]',
        header: 'border-b-0 px-8 pb-4 pt-8',
        body: 'px-8 pb-8 pt-0',
      }}
      hideCloseButton={true}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <h3 className="text-[20px] font-[500]">We're Here to Help</h3>
              <Button
                isIconOnly
                variant="light"
                onPress={onModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="size-6" />
              </Button>
            </ModalHeader>
            <ModalBody>
              <div className="">
                <p className="text-[16px] text-gray-700">Need help with:</p>
                <ul className="ml-6 list-disc text-[16px] text-gray-700">
                  <li>General complaints or issue handling</li>
                  <li>Refund requests related to account theft</li>
                  <li>Other concerns</li>
                </ul>

                <div className="mt-6 flex items-center gap-2 text-[16px] text-gray-700">
                  <span>👉</span>
                  <span>Contact us at:</span>
                  <a
                    href="mailto:official@influxy.xyz"
                    className="text-black underline"
                  >
                    official@influxy.xyz
                  </a>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
