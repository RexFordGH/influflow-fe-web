'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import React from 'react';

export type DialogType = 'exit' | 'skip';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: DialogType;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
}) => {
  const dialogConfig = {
    exit: {
      title: 'Quit Generating?',
      message:
        'Are you sure you want to go back and all the message will be lost?',
      confirmText: 'Quit',
      cancelText: 'Cancel',
    },
    skip: {
      title: 'Skip Confirmation?',
      message:
        'Are you sure you want to skip draft confirmation and generate content directly?',
      confirmText: 'Skip',
      cancelText: 'Cancel',
    },
  };

  const config = dialogConfig[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      classNames={{
        base: 'w-[560px]',
        backdrop: 'bg-black/10',
      }}
    >
      <ModalContent 
        className="bg-white p-6"
        style={{
          borderRadius: '20px',
          boxShadow: '0 0 15px rgba(95, 99, 110, 0.1)',
        }}
      >
        {(onClose) => (
          <>
            <ModalHeader className="p-0 pb-3">
              <h2
                className="text-black"
                style={{ 
                  fontFamily: 'Poppins',
                  fontSize: '20px',
                  fontWeight: '500',
                  lineHeight: '30px',
                }}
              >
                {config.title}
              </h2>
            </ModalHeader>

            <ModalBody className="p-0 pb-6">
              <p
                className="text-black"
                style={{ 
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: '400',
                  lineHeight: '24px',
                }}
              >
                {config.message}
              </p>
            </ModalBody>

            <ModalFooter className="p-0 gap-3 justify-end">
              <Button
                variant="bordered"
                radius="full"
                size="md"
                onPress={onClose}
                className="h-10 px-6 border-gray-300 font-normal text-gray-700"
                style={{ fontFamily: 'Poppins' }}
              >
                {config.cancelText}
              </Button>
              <Button
                color="danger"
                radius="full"
                size="md"
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                className="h-10 px-6 font-normal"
                style={{ fontFamily: 'Poppins' }}
              >
                {config.confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
