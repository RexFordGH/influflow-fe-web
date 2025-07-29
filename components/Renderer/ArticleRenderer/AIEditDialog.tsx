import React from 'react';
import { Button } from '@heroui/react';

interface AIEditDialogProps {
  isOpen: boolean;
  instruction: string;
  isProcessing: boolean;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const AIEditDialog: React.FC<AIEditDialogProps> = React.memo(({
  isOpen,
  instruction,
  isProcessing,
  onInstructionChange,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-1/2">
      <div className="flex h-full items-end">
        <div className="flex w-full flex-col bg-[#F5F6F7] p-[20px]">
          <div className="mb-[24px]">
            <h3 className="text-xl font-semibold">
              How would you like to enhance this part?
            </h3>
          </div>
          <div className="flex-1">
            <textarea
              value={instruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder="Please limit to 300 words."
              maxLength={300}
              className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
              rows={8}
              autoFocus
              disabled={isProcessing}
            />
            <div className="mt-[12px] flex justify-end gap-3">
              <Button
                variant="flat"
                onPress={onClose}
                className="px-6"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={onSubmit}
                isLoading={isProcessing}
                disabled={!instruction.trim() || isProcessing}
                className="bg-[#4285F4] px-6 text-white hover:bg-[#3367D6]"
              >
                {isProcessing ? 'Generating...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AIEditDialog.displayName = 'AIEditDialog';