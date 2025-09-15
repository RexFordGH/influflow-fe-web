'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal, ModalContent } from '@heroui/react';
import { motion } from 'framer-motion';

import { useSubscriptionStore } from '@/stores/subscriptionStore';

interface CreditsUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsUsageModal = ({ isOpen, onClose }: CreditsUsageModalProps) => {
  const { creditRules } = useSubscriptionStore();

  // 如果有真实数据则使用真实数据，否则使用默认值
  const displayRules =
    creditRules.length > 0
      ? creditRules.map((rule) => ({
          title: rule.name,
          credits: `${rule.credits} credit${rule.credits > 1 ? 's' : ''} / request`,
        }))
      : [
          {
            title: 'Text generation',
            credits: '1 credit / request',
          },
          {
            title: 'Deep research',
            credits: '5-10 credits / request',
          },
          {
            title: 'Image generation',
            credits: '5 credits / request',
          },
        ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      placement="center"
      classNames={{
        backdrop: 'bg-black/50',
        base: 'border-0',
        body: 'p-0',
        header: 'p-0 border-0',
        footer: 'border-0',
        closeButton: 'hidden',
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
        <div className="flex flex-col gap-10 rounded-[20px] bg-white p-8 shadow-[0_0_15px_rgba(95,99,110,0.1)]">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h2 className="text-[20px] font-semibold text-black">
              Credits Usage Rules
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 transition-colors hover:bg-gray-100"
            >
              <XMarkIcon className="size-5 text-black" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-6">
            {/* Description */}
            <p className="text-[16px] text-black">
              Credits are consumed for every generation request.
            </p>

            {/* Usage Rules */}
            <div className="flex flex-col gap-2">
              {displayRules.map((rule, index) => (
                <motion.div
                  key={rule.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-[12px] bg-[#F8F8F8] p-3"
                >
                  <span className="text-[16px] font-medium text-black">
                    {rule.title}
                  </span>
                  <span className="text-[16px] font-medium text-black">
                    {rule.credits}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Note */}
            <p className="text-[14px] text-[#757575]">
              Note: Actual credit consumption may vary depending on the
              complexity of your request and the number of tokens processed.
              More detailed or resource-intensive generations will use more
              credits.
            </p>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default CreditsUsageModal;
