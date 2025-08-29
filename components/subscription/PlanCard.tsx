'use client';

import { cn } from '@heroui/react';
import { motion } from 'framer-motion';
import { Button } from '../base';

interface PlanCardProps {
  planName: string;
  price: string;
  priceUnit?: string;
  features: string[];
  isCurrentPlan?: boolean;
  isMostPopular?: boolean;
  isRecommended?: boolean;
  highlighted?: boolean;
  onSwitch: () => void;
  isLoading?: boolean;
}

const PlanCard = ({
  planName,
  price,
  priceUnit,
  features,
  isCurrentPlan = false,
  isMostPopular = false,
  isRecommended = false,
  highlighted = false,
  onSwitch,
  isLoading = false,
}: PlanCardProps) => {
  const isFreePlan = price === '0';

  return (
    <motion.div
      whileHover={!isCurrentPlan ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative flex h-full flex-col rounded-[24px] bg-white p-10 transition-shadow ${
        highlighted
          ? 'border border-black shadow-[0_0_15px_rgba(0,0,0,0.15)]'
          : 'hover:shadow-lg'
      }`}
    >
      {/* Plan Name and Popular/Recommended Badge */}
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[20px] font-medium text-black">{planName}</h3>
        {(isMostPopular || isRecommended) && (
          <div className="flex items-center gap-1 rounded-[8px] bg-[#EFEFEF] px-3 py-1">
            <svg
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 0L7.95934 4.49139L12.6819 4.4549L8.78547 7.25361L10.3107 11.7951L6.5 8.89639L2.68933 11.7951L4.21453 7.25361L0.318133 4.4549L5.04066 4.49139L6.5 0Z"
                fill="black"
              />
            </svg>
            <span className="text-[11px] font-medium text-black">
              {isMostPopular ? 'Most Popular' : 'Recommended'}
            </span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-3">
        {isFreePlan ? (
          <span className="text-[32px] font-medium text-black">{price}</span>
        ) : (
          <div className="flex items-baseline">
            <span className="text-[32px] font-medium text-black">${price}</span>
            <span className="text-[16px] font-medium text-black">
              {priceUnit}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mb-6">
        {isCurrentPlan ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-[48px] items-center justify-center rounded-[16px] bg-[#EFEFEF]"
          >
            <span className="text-[16px] font-medium text-[#8C8C8C]">
              Your Current Plan
            </span>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onPress={onSwitch}
              isDisabled={isLoading}
              className={cn(
                'h-[48px] w-full rounded-[16px] text-[16px] font-medium transition-all hover:shadow-md disabled:opacity-50 ',
                isFreePlan
                  ? 'bg-[#EFEFEF] border-none ext-[#8C8C8C]'
                  : 'bg-black text-white hover:bg-gray-800',
              )}
            >
              {isLoading ? 'Processing...' : 'Switch Plan'}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Features */}
      <div className="flex flex-col gap-1">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 shrink-0"
            >
              <path
                d="M16.6667 5L7.5 14.1667L3.33333 10"
                stroke="#FF4500"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[14px] text-black">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PlanCard;
