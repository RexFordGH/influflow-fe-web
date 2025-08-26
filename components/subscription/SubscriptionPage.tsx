'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import PlanCard from './PlanCard';

interface SubscriptionPageProps {
  onBack: () => void;
}

export const SubscriptionPage = ({ onBack }: SubscriptionPageProps) => {
  const [currentPlan] = useState<'free' | 'starter' | 'pro'>('free');
  const [remainingCredits] = useState(1400);
  const [totalCredits] = useState(1900);
  const [planExpiry] = useState('September 22, 2025');

  const handleSwitchPlan = (plan: 'free' | 'starter' | 'pro') => {
    console.log('Switching to plan:', plan);
  };

  const handleViewInvoices = () => {
    console.log('View invoices clicked');
  };

  const creditPercentage = (remainingCredits / totalCredits) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen overflow-y-auto bg-[#F8F8F8]"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3"
      >
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="light"
            onPress={onBack}
            className="text-gray-600 transition-colors hover:text-black"
            startContent={<ChevronLeftIcon className="size-4" />}
          >
            Back
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1440px] px-[160px] py-[40px]">
        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 text-center text-[32px] font-medium text-black"
        >
          Manage Subscription
        </motion.h1>

        {/* Stats Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10 flex gap-6"
        >
          {/* Remaining Credits */}
          <div className="flex-1 rounded-[24px] bg-white p-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-[20px] font-medium text-black">
                Remaining Credits
              </h2>
              <div className="group relative">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="cursor-help text-gray-400"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                  <text
                    x="10"
                    y="14"
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                  >
                    ?
                  </text>
                </svg>
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-black p-2 text-xs text-white shadow-lg group-hover:block">
                  Credits are used for generating content
                  <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 -translate-y-1 border-x-[5px] border-t-[5px] border-x-transparent border-t-black"></div>
                </div>
              </div>
            </div>

            <div className="mb-1 text-[32px] font-medium text-black">
              {remainingCredits.toLocaleString()} Credits
            </div>

            {/* Progress Bar */}
            <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[#EAEAEA]">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-black transition-all duration-300"
                style={{ width: `${creditPercentage}%` }}
              />
            </div>
          </div>

          {/* Your Plan */}
          <div className="flex-1 rounded-[24px] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-medium text-black">Your Plan</h2>
              <span className="text-[16px] text-black">Free Plan</span>
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-black">
                  Current Plan Active Until:
                </span>
                <span className="text-[16px] text-black">{planExpiry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-black">Subscription History:</span>
                <button
                  onClick={handleViewInvoices}
                  className="text-[16px] text-black underline transition-opacity hover:opacity-70"
                >
                  View Invoices
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plan Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-6"
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex-1"
          >
            <PlanCard
              planName="Free Plan"
              price="0"
              features={[
                'Limited generation',
                '50 free credits / month',
                'Access to all features',
                'Great for trying out and exploring',
              ]}
              isCurrentPlan={currentPlan === 'free'}
              onSwitch={() => handleSwitchPlan('free')}
            />
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex-1"
          >
            <PlanCard
              planName="Starter Plan"
              price="29"
              priceUnit="/month"
              features={[
                'Larger monthly allowance',
                '1000 free credits / month',
                'Access to all features',
                'Perfect for regular creators',
              ]}
              isCurrentPlan={currentPlan === 'starter'}
              isMostPopular={true}
              onSwitch={() => handleSwitchPlan('starter')}
              highlighted={true}
            />
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex-1"
          >
            <PlanCard
              planName="Pro Plan"
              price="59"
              priceUnit="/month"
              features={[
                'Generous credits for heavy usage',
                '6000 free credits / month',
                'Access to all features',
                'Best for professionals',
              ]}
              isCurrentPlan={currentPlan === 'pro'}
              onSwitch={() => handleSwitchPlan('pro')}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};