'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { addToast } from '@/components/base/toast';
import {
  PlanType,
  useCreateBillingPortal,
  useCreateCheckoutSession,
  useCreditRules,
  useSubscriptionInfo,
  useUpdateSubscriptionPlan,
} from '@/lib/api/services';
import { redirectToCheckout } from '@/lib/stripe';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

import { useAuthStore } from '@/stores/authStore';
import CreditsUsageModal from './CreditsUsageModal';
import PlanCard from './PlanCard';
import PlanChangeModal from './PlanChangeModal';

interface SubscriptionPageProps {
  onBack: () => void;
}

export const SubscriptionPage = ({ onBack }: SubscriptionPageProps) => {
  const { isAuthenticated, openLoginModal } = useAuthStore();

  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [planChangeModal, setPlanChangeModal] = useState<{
    isOpen: boolean;
    targetPlan: PlanType | null;
  }>({ isOpen: false, targetPlan: null });

  // 从 store 获取订阅信息
  const {
    currentPlan,
    nextPlan,
    credits,
    currentPeriodEnd,
    setSubscriptionInfo,
    setCreditRules,
    setError,
  } = useSubscriptionStore();

  // API hooks
  const {
    data: subscriptionInfo,
    isLoading: isLoadingInfo,
    error: infoError,
    refetch: refetchSubscriptionInfo,
  } = useSubscriptionInfo();
  const { data: creditRulesData, isLoading: isLoadingRules } = useCreditRules();
  const { mutate: createCheckoutSession, isPending: isCreatingCheckout } =
    useCreateCheckoutSession();
  const { mutate: createBillingPortal, isPending: isCreatingPortal } =
    useCreateBillingPortal();
  const { mutate: updatePlan, isPending: isUpdatingPlan } =
    useUpdateSubscriptionPlan();

  // 检查 URL 参数中是否有 status 标记
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'success') {
      addToast({
        title: 'Payment successful! Your subscription has been upgraded.',
        color: 'success',
      });

      // 刷新订阅信息以获取最新状态
      refetchSubscriptionInfo();

      // 清理 URL 参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (status === 'cancel') {
      addToast({
        title: 'Payment cancelled. You can upgrade anytime.',
        color: 'warning',
      });

      // 清理 URL 参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [refetchSubscriptionInfo]);

  // 更新 store 中的订阅信息
  useEffect(() => {
    if (subscriptionInfo) {
      setSubscriptionInfo(subscriptionInfo);
    }
  }, [subscriptionInfo, setSubscriptionInfo]);

  // 更新积分规则
  useEffect(() => {
    if (creditRulesData?.rules) {
      setCreditRules(creditRulesData.rules);
    }
  }, [creditRulesData, setCreditRules]);

  // 处理错误
  useEffect(() => {
    if (infoError) {
      const errorMessage = 'Failed to load subscription information';
      setError(errorMessage);
      addToast({ title: errorMessage, color: 'danger' });
    }
  }, [infoError, setError]);

  // 处理套餐切换按钮点击
  const handleSwitchPlan = (plan: PlanType) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    // 如果选择当前套餐且没有预定的变更，不做任何操作
    if (plan === currentPlan && !nextPlan) {
      return;
    }

    // 所有情况都打开确认弹窗
    setPlanChangeModal({ isOpen: true, targetPlan: plan });
  };

  // 处理弹窗确认
  const handleConfirmPlanChange = async () => {
    if (!planChangeModal.targetPlan) return;

    const plan = planChangeModal.targetPlan;

    // 设置正在处理的套餐
    setProcessingPlan(plan);

    // 如果是取消预定的套餐变更
    if (plan === currentPlan && nextPlan) {
      updatePlan(plan, {
        onSuccess: async () => {
          addToast({
            title: 'Scheduled plan change has been cancelled',
            color: 'success',
          });
          setProcessingPlan(null);
          setPlanChangeModal({ isOpen: false, targetPlan: null });
          // 刷新订阅信息
          await refetchSubscriptionInfo();
        },
        onError: (error) => {
          addToast({
            title: `Failed to cancel plan change: ${error.message}`,
            color: 'danger',
          });
          setProcessingPlan(null);
          setPlanChangeModal({ isOpen: false, targetPlan: null });
        },
      });
      return;
    }

    // 如果是从 free 升级到付费套餐，创建 Checkout Session
    if (currentPlan === 'free' && plan !== 'free') {
      createCheckoutSession(plan, {
        onSuccess: async (data) => {
          // 先刷新订阅信息
          await refetchSubscriptionInfo();
          // 直接使用服务端返回的 checkout_url
          if (data.checkout_url) {
            redirectToCheckout(data.checkout_url);
          } else {
            addToast({ title: 'Checkout URL not found', color: 'danger' });
            setProcessingPlan(null);
            setPlanChangeModal({ isOpen: false, targetPlan: null });
          }
        },
        onError: (error) => {
          addToast({
            title: `Failed to create checkout session: ${error.message}`,
            color: 'danger',
          });
          setProcessingPlan(null);
          setPlanChangeModal({ isOpen: false, targetPlan: null });
        },
      });
    } else {
      // 其他情况使用 update-plan 接口
      updatePlan(plan, {
        onSuccess: async (data) => {
          const message =
            plan === 'free'
              ? `Your subscription will be cancelled at the end of the current period (${data.effective_date})`
              : data.effective_date === new Date().toISOString().split('T')[0]
                ? 'Plan upgraded successfully!'
                : `Plan change scheduled for ${data.effective_date}`;
          addToast({ title: message, color: 'success' });
          setProcessingPlan(null);
          setPlanChangeModal({ isOpen: false, targetPlan: null });
          // 刷新订阅信息
          await refetchSubscriptionInfo();
        },
        onError: (error) => {
          addToast({
            title: `Failed to update plan: ${error.message}`,
            color: 'danger',
          });
          setProcessingPlan(null);
          setPlanChangeModal({ isOpen: false, targetPlan: null });
        },
      });
    }
  };

  // 查看发票
  const handleViewInvoices = () => {
    createBillingPortal(undefined, {
      onError: (error) => {
        addToast({
          title: `Failed to open billing portal: ${error.message}`,
          color: 'danger',
        });
      },
    });
  };

  // 计算积分百分比
  const totalCredits =
    currentPlan === 'free' ? 50 : currentPlan === 'starter' ? 2000 : 6000;
  const creditPercentage = Math.min((credits / totalCredits) * 100, 100);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取套餐显示名称
  const getPlanDisplayName = (plan: PlanType) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
  };

  const isLoading = isLoadingInfo || isLoadingRules;
  const isProcessing = isCreatingCheckout || isCreatingPortal || isUpdatingPlan;

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
        className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-[8px]"
      >
        <div className="flex items-center">
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
              <button
                onClick={() => setIsCreditsModalOpen(true)}
                className="group relative rounded-full p-1 transition-colors hover:bg-gray-100"
                disabled={isLoading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="cursor-help text-gray-400 transition-colors group-hover:text-gray-600"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
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
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black p-2 text-xs text-white shadow-lg group-hover:block">
                  Click to see credits usage rules
                  <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 -translate-y-1 border-x-[5px] border-t-[5px] border-x-transparent border-t-black"></div>
                </div>
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="mb-1 h-[32px] w-[200px] rounded bg-gray-200"></div>
                <div className="h-[6px] w-full rounded-full bg-gray-200"></div>
              </div>
            ) : (
              <>
                <div className="mb-1 text-[32px] font-medium text-black">
                  {credits.toLocaleString()} / {totalCredits.toLocaleString()}{' '}
                  Credits
                </div>
                {/* Progress Bar */}
                <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[#EAEAEA]">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-black transition-all duration-300"
                    style={{ width: `${creditPercentage}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Your Plan */}
          <div className="flex-1 rounded-[24px] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-medium text-black">Your Plan</h2>
              <span className="text-[16px] text-black">
                {isLoading ? (
                  <div className="h-[24px] w-[100px] animate-pulse rounded bg-gray-200"></div>
                ) : (
                  getPlanDisplayName(currentPlan)
                )}
              </span>
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-black">
                  Current Plan Active Until:
                </span>
                <span className="text-[16px] text-black">
                  {isLoading ? (
                    <div className="h-[24px] w-[150px] animate-pulse rounded bg-gray-200"></div>
                  ) : (
                    formatDate(currentPeriodEnd)
                  )}
                </span>
              </div>
              {nextPlan && (
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-black">Next Plan:</span>
                  <span className="text-[16px] text-black">
                    {getPlanDisplayName(nextPlan)} (scheduled)
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-black">
                  Subscription History:
                </span>
                <button
                  onClick={handleViewInvoices}
                  className="text-[16px] text-black underline transition-opacity hover:opacity-70 disabled:opacity-50"
                  disabled={isProcessing || currentPlan === 'free'}
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
              isLoading={processingPlan === 'free'}
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
                '2000 credits / month',
                'Access to all features',
                'Perfect for regular creators',
              ]}
              isCurrentPlan={currentPlan === 'starter'}
              isMostPopular={currentPlan === 'free'}
              onSwitch={() => handleSwitchPlan('starter')}
              highlighted={currentPlan === 'free'}
              isLoading={processingPlan === 'starter'}
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
                '6000 credits / month',
                'Access to all features',
                'Best for professionals',
              ]}
              isCurrentPlan={currentPlan === 'pro'}
              isRecommended={currentPlan === 'starter'}
              onSwitch={() => handleSwitchPlan('pro')}
              highlighted={currentPlan === 'starter'}
              isLoading={processingPlan === 'pro'}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Credits Usage Modal */}
      <CreditsUsageModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />

      {/* Plan Change Modal */}
      {planChangeModal.targetPlan && (
        <PlanChangeModal
          isOpen={planChangeModal.isOpen}
          onClose={() =>
            setPlanChangeModal({ isOpen: false, targetPlan: null })
          }
          onConfirm={handleConfirmPlanChange}
          currentPlan={currentPlan}
          targetPlan={planChangeModal.targetPlan}
          currentPeriodEnd={currentPeriodEnd}
          nextPlan={nextPlan}
          isLoading={isProcessing}
        />
      )}
    </motion.div>
  );
};
