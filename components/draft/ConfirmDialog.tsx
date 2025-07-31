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
        base: 'max-w-lg',
        backdrop: 'bg-black/50',
      }}
    >
      <ModalContent className="rounded-3xl bg-white p-8">
        {(onClose) => (
          <>
            <ModalHeader className="mb-6 p-0">
              <h2
                className="text-2xl font-medium"
                style={{ fontFamily: 'Poppins' }}
              >
                {config.title}
              </h2>
            </ModalHeader>

            <ModalBody className="mb-8 p-0">
              <p
                className="text-lg text-black"
                style={{ fontFamily: 'Poppins' }}
              >
                {config.message}
              </p>
            </ModalBody>

            <ModalFooter className="gap-4 p-0">
              <Button
                variant="bordered"
                radius="full"
                size="lg"
                onPress={onClose}
                className="h-12 flex-1 border-gray-300 font-medium text-gray-700"
                style={{ fontFamily: 'Poppins' }}
              >
                {config.cancelText}
              </Button>
              <Button
                color="danger"
                radius="full"
                size="lg"
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                className="h-12 flex-1 font-medium"
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
