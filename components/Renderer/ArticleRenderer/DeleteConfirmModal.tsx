import React from 'react';
import { Button } from '@heroui/react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  itemName = 'this item'
}) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Image ?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete {itemName}?
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onPress={onClose}
            className="rounded-full bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            className="rounded-full"
            onPress={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;