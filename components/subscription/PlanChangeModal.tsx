'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@heroui/react';
import { motion } from 'framer-motion';

import { PlanType } from '@/lib/api/services';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: PlanType;
  targetPlan: PlanType;
  currentPeriodEnd: string | null;
  nextPlan?: PlanType | null;
  isLoading?: boolean;
}

// 套餐信息配置
const PLAN_CONFIG = {
  free: {
    name: 'Free Plan',
    price: 0,
    credits: 50,
    color: 'rgb(0, 0, 0)',
  },
  starter: {
    name: 'Starter Plan',
    price: 29,
    credits: 1000,
    color: 'rgb(68, 138, 255)',
  },
  pro: {
    name: 'Pro Plan',
    price: 59,
    credits: 6000,
    color: 'rgb(101, 99, 255)',
  },
};

export default function PlanChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  targetPlan,
  currentPeriodEnd,
  nextPlan,
  isLoading = false,
}: PlanChangeModalProps) {
  // 获取套餐信息
  const currentPlanInfo = PLAN_CONFIG[currentPlan];
  const targetPlanInfo = PLAN_CONFIG[targetPlan];

  // 判断是否是取消预定的套餐变更
  const isCancellingScheduledChange = currentPlan === targetPlan && !!nextPlan;

  // 判断是升级还是降级
  const isUpgrade =
    !isCancellingScheduledChange &&
    PLAN_CONFIG[targetPlan].price > PLAN_CONFIG[currentPlan].price;
  const isDowngrade =
    !isCancellingScheduledChange &&
    PLAN_CONFIG[targetPlan].price < PLAN_CONFIG[currentPlan].price;

  // 计算今日应付金额（仅用于从 Starter 升级到 Pro 的情况）
  const calculateAmountDue = () => {
    // 取消预定变更不需要付费
    if (isCancellingScheduledChange) {
      return 0;
    }

    // 从 Free 升级到付费套餐，直接显示套餐价格
    if (currentPlan === 'free') {
      return targetPlanInfo.price;
    }

    // 从 Starter 升级到 Pro，显示差价
    if (currentPlan === 'starter' && targetPlan === 'pro') {
      return targetPlanInfo.price - currentPlanInfo.price;
    }

    // 降级或其他情况，不显示金额
    return 0;
  };

  const amountDue = calculateAmountDue();

  // 获取描述文本
  const getDescriptionText = () => {
    if (isCancellingScheduledChange && nextPlan) {
      // 取消预定的套餐变更
      const nextPlanInfo = PLAN_CONFIG[nextPlan];
      return `You are about to cancel your scheduled plan change to ${nextPlanInfo.name}. You will remain on your current ${currentPlanInfo.name} plan.`;
    }

    if (currentPlan === 'free' && targetPlan !== 'free') {
      // 从免费升级到付费
      return `Your subscription plan will renew today, and you will receive ${targetPlanInfo.credits.toLocaleString()} credits per month.`;
    }

    if (isDowngrade) {
      // 降级
      const formattedDate = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'the end of current period';
      return `You'll stay on your current plan until ${formattedDate}. Starting from that date, your subscription will renew with ${targetPlanInfo.credits.toLocaleString()} credits each month.`;
    }

    if (isUpgrade) {
      // 升级
      return `Your subscription plan will renew today, and you will receive ${targetPlanInfo.credits.toLocaleString()} credits per month.`;
    }

    return '';
  };

  // 获取标题
  const getModalTitle = () => {
    if (isCancellingScheduledChange) return 'Cancel Plan Change';
    if (isDowngrade) return 'Downgrade Plan';
    if (isUpgrade) return 'Upgrade Plan';
    return 'Change Plan';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      classNames={{
        base: 'bg-white max-w-[560px]',
        header: 'border-b-0 p-8 pb-0',
        body: 'p-8 pt-10',
        closeButton: 'hidden',
      }}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center justify-between p-8 pb-0">
              <h2 className="text-[20px] font-semibold text-black">
                {getModalTitle()}
              </h2>
              <button
                onClick={onModalClose}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
                disabled={isLoading}
              >
                <XMarkIcon className="size-5 text-gray-500" />
              </button>
            </ModalHeader>

            <ModalBody className="flex flex-col gap-10 p-8 pt-10">
              {/* 描述文本 */}
              <p className="text-[16px] leading-6 text-black">
                {getDescriptionText()}
              </p>

              {/* 套餐对比卡片 - 仅在非取消场景显示 */}
              {!isCancellingScheduledChange && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 rounded-[24px] bg-[#F8F8F8] p-6">
                    {/* From 行 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-end gap-3">
                        <span className="text-[14px] text-black">From</span>
                        <span
                          className="text-[18px] font-medium"
                          style={{ color: currentPlanInfo.color }}
                        >
                          {currentPlanInfo.name}
                        </span>
                      </div>
                      <span className="text-[16px] font-medium text-black">
                        ${currentPlanInfo.price}/month
                      </span>
                    </div>

                    {/* 分割线 */}
                    <div className="h-px w-full bg-[#D8D8D8]" />

                    {/* To 行 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-end gap-3">
                        <span className="text-[14px] text-black">To</span>
                        <span
                          className="text-[18px] font-medium"
                          style={{ color: targetPlanInfo.color }}
                        >
                          {targetPlanInfo.name}
                        </span>
                      </div>
                      <span className="text-[16px] font-medium text-black">
                        ${targetPlanInfo.price}/month
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
              >
                <Button
                  size="lg"
                  className="h-12 w-[200px] rounded-full bg-[#448AFF] font-medium text-white "
                  onPress={onConfirm}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isCancellingScheduledChange
                    ? 'Cancel Change'
                    : 'Confirm Changes'}
                </Button>
              </motion.div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
