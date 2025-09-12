'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SubscriptionTermsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBSCRIPTION_TERMS = [
  {
    title: '1. Subscription & Billing',
    content:
      'By subscribing to a paid plan on Influxy, you authorize us to charge your provided payment method (via Stripe) the applicable subscription fee at the beginning of each billing cycle.',
  },
  {
    title: '2. Automatic Renewal',
    content:
      'Your subscription will automatically renew at the end of each billing cycle, unless you cancel before the renewal date. Renewal charges will be made to the payment method on file.',
  },
  {
    title: '3. Cancellation Policy',
    content:
      'You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing cycle, and you will retain access to your paid features until then. Subscription fees already paid are non-refundable.',
  },
  {
    title: '4. Plan Changes',
    content:
      'You may upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the start of the next billing cycle.',
  },
  {
    title: '5. Failed Payments',
    content:
      'If a recurring payment is declined, we may suspend or terminate your subscription until a valid payment method is provided. You remain responsible for any unpaid amounts.',
  },
  {
    title: '6. Contact Information',
    content:
      'For billing inquiries or disputes, please contact us at official@influxy.ai',
  },
];

export default function SubscriptionTerms({
  isOpen,
  onClose,
}: SubscriptionTermsProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="z-50 h-[500px] overflow-y-scroll flex flex-col overflow-hidden rounded-[24px] bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex h-[72px] min-h-[72px] items-center justify-between border-b border-gray-100 px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Back"
            className="rounded-lg p-1 transition-colors hover:bg-gray-100"
          >
            <ChevronLeftIcon className="size-5 text-gray-700" />
          </button>
          <h2 className="text-[18px] font-medium text-black">
            Subscription Terms
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-[16px] text-black font-poppins">
          {SUBSCRIPTION_TERMS.map((term, index) => (
            <section key={index}>
              <h3 className="mb-[6px] text-[14px] font-medium">{term.title}</h3>
              <p className="text-[12px]">{term.content}</p>
            </section>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
