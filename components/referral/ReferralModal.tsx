'use client';

import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  Skeleton,
} from '@heroui/react';
import * as Icon from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { addToast } from '@/components/base/toast';
import type { ReferralInfo } from '@/lib/api/referral';
import {
  REFERRAL_QUERY_KEYS,
  useClaimReferralCredits,
  useReferralInfo,
} from '@/lib/api/referral';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useQueryClient } from '@tanstack/react-query';
import { ReferralRules } from './ReferralRules';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [showRules, setShowRules] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { refreshSubscriptionInfo } = useSubscriptionStore();
  const queryClient = useQueryClient();

  // 使用新的 hooks
  const { data: info, isLoading: loading } = useReferralInfo();
  const { mutateAsync: claimCreditsAsync, isPending: claiming } =
    useClaimReferralCredits();

  const referralLink = useMemo(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL;
    return `${origin}/referral/${info?.referral_code || 'LOADING'}`;
  }, [info?.referral_code]);

  useEffect(() => {
    if (!isOpen) {
      setShowRules(false); // Reset rules display state when closing modal
      setIsCopied(false); // Reset copy state
    }
  }, [isOpen]);

  // 处理 info 可能为 undefined 的情况，提供默认值
  const safeInfo: ReferralInfo = info || {
    referral_code: '',
    referral_link: '',
    total_referrals_count: 0,
    active_customers_count: 0,
    referral_credits: 0,
    revenue: 0,
    promoter_portal: undefined,
    setup_password_link: undefined,
  };

  const copyReferralLink = async () => {
    if (!info || !safeInfo.referral_code) return;

    const url = `${window.location.origin}/referral/${safeInfo.referral_code}`;

    try {
      await navigator.clipboard.writeText(url);
      addToast({
        title: 'Referral link copied to clipboard',
        color: 'success',
      });
      setIsCopied(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      addToast({
        title: 'Failed to copy, please copy manually',
        color: 'danger',
      });
    }
  };

  const claimCredits = async () => {
    if (!info || claiming || (safeInfo.referral_credits ?? 0) <= 0) return;

    try {
      const result = await claimCreditsAsync();

      if (result.success) {
        addToast({
          title: `Successfully claimed ${result.credits_claimed || safeInfo.referral_credits} credits`,
          color: 'success',
        });

        // Refresh referral info by invalidating the query
        await queryClient.invalidateQueries({
          queryKey: REFERRAL_QUERY_KEYS.REFERRAL_INFO,
        });

        // Refresh subscription info to update credits display
        await refreshSubscriptionInfo();
      } else {
        addToast({
          title: 'Failed to claim, please try again later',
          color: 'danger',
        });
      }
    } catch (err) {
      console.error('Failed to claim credits:', err);
      addToast({ title: '领取失败，请稍后重试', color: 'danger' });
    }
  };

  const handleCommissionClaim = () => {
    if (!info) return;

    if (safeInfo.setup_password_link) {
      window.open(safeInfo.setup_password_link, '_blank');
    } else if (safeInfo.promoter_portal) {
      window.open(safeInfo.promoter_portal, '_blank');
    } else {
      addToast({
        title: 'No commission management link available',
        color: 'danger',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      classNames={{
        base: 'max-w-[640px]',
        backdrop: 'bg-black/50',
        wrapper: 'items-center',
      }}
      hideCloseButton={true}
    >
      <ModalContent className="relative rounded-[20px] shadow-[0_0_15px_rgba(95,99,110,0.1)] overflow-hidden">
        <ModalBody className="p-0">
          <AnimatePresence mode="wait">
            {!showRules ? (
              <motion.div
                key="main"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                // transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col gap-10 p-8"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-center">
                    <h2 className="font-poppins text-[28px] font-semibold leading-[42px] text-black">
                      Invite to Earn
                    </h2>
                    <p className="font-poppins text-[14px] font-normal leading-[21px] text-[rgb(140,140,140)]">
                      Earn 30 credits for every friend you invite.
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={onClose}
                    className="size-8 min-w-8"
                  >
                    <Icon.X size={24} />
                  </Button>
                </div>

                {/* Share Link Section */}
                <div className="flex flex-col gap-2">
                  <p className="font-poppins text-[14px] font-medium leading-[21px] text-[rgb(140,140,140)]">
                    Share Your Invitation Link
                  </p>
                  <div className="flex gap-4 items-center">
                    {loading ? (
                      <Skeleton className="h-12 flex-1 rounded-[12px]" />
                    ) : (
                      <div className="flex flex-1 items-center gap-3 rounded-[12px] border border-[#E3E3E3] bg-[rgb(248,248,248)] px-4 py-3">
                        <Image
                          src="/icons/UrlLink.svg"
                          alt="Link"
                          width={20}
                          height={20}
                          className="shrink-0"
                        />
                        <span className="flex-1 font-poppins text-[16px] font-medium leading-6 text-black">
                          {referralLink}
                        </span>
                      </div>
                    )}
                    <Button
                      className="min-w-[120px] rounded-[12px] bg-black px-8 py-3 font-poppins text-[16px] font-medium leading-6 text-white"
                      onPress={copyReferralLink}
                      startContent={
                        isCopied ? (
                          <Icon.Check size={16} />
                        ) : (
                          <Icon.Copy size={16} />
                        )
                      }
                      isDisabled={loading || !info}
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px flex-1 bg-[rgb(227,227,227)]" />
                  <span className="font-poppins text-[14px] font-medium leading-[21px] text-[rgb(140,140,140)]">
                    Invitation History
                  </span>
                  <div className="h-px flex-1 bg-[rgb(227,227,227)]" />
                </div>

                {/* Statistics */}
                <div className="flex gap-4">
                  {/* Total Invites */}
                  <div className="flex flex-[240] flex-col items-center justify-center gap-6 rounded-[12px] bg-[rgb(248,248,248)] p-6">
                    {loading ? (
                      <>
                        <Skeleton className="h-10 w-16 rounded-lg" />
                        <div className="flex flex-col items-center gap-1">
                          <Skeleton className="h-5 w-24 rounded" />
                          <Skeleton className="h-5 w-32 rounded" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="font-poppins text-[40px] font-medium leading-10 text-black">
                            {safeInfo.total_referrals_count}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <Image
                              src="/icons/Users.svg"
                              alt="Users"
                              width={20}
                              height={20}
                              className="opacity-60"
                            />
                            <span className="font-poppins text-[14px] font-normal text-[rgb(140,140,140)]">
                              Total Invites
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-poppins text-[14px] font-medium text-black">
                              {safeInfo.active_customers_count}
                            </span>
                            <span className="font-poppins text-[14px] font-normal text-[rgb(140,140,140)]">
                              Active Subscribers
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="flex w-[152px] flex-col gap-2 justify-between">
                    <div className="flex flex-col h-[120px] items-center justify-center gap-3 rounded-[12px] bg-[rgb(248,248,248)] p-6">
                      {loading ? (
                        <>
                          <Skeleton className="h-8 w-16 rounded-lg" />
                          <Skeleton className="h-5 w-20 rounded" />
                        </>
                      ) : (
                        <>
                          <div className="font-poppins text-[32px] font-medium leading-8 text-black">
                            {safeInfo.referral_credits}
                          </div>
                          <div className="flex items-center gap-1">
                            <Image
                              src="/icons/streamline_star-2-remix.svg"
                              alt="Credits"
                              width={18}
                              height={18}
                              className="opacity-60"
                            />
                            <span className="font-poppins text-[14px] font-normal text-[rgb(140,140,140)]">
                              Credits
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-[30px] rounded-[12px] bg-[rgb(248,248,248)] font-poppins text-[14px] font-normal text-black hover:bg-gray-200"
                      onPress={claimCredits}
                      isDisabled={
                        loading ||
                        !safeInfo.referral_credits ||
                        safeInfo.referral_credits <= 0 ||
                        claiming
                      }
                      isLoading={claiming}
                    >
                      Claim
                    </Button>
                  </div>

                  {/* Commission */}
                  <div className="flex w-[152px] flex-col gap-2">
                    <div className="flex flex-col h-[120px] items-center justify-center gap-3 rounded-[12px] bg-[rgb(248,248,248)] p-6">
                      {loading ? (
                        <>
                          <Skeleton className="h-8 w-16 rounded-lg" />
                          <Skeleton className="h-5 w-24 rounded" />
                        </>
                      ) : (
                        <>
                          <div className="font-poppins text-[32px] font-medium leading-8 text-black">
                            ${safeInfo.revenue}
                          </div>
                          <div className="flex items-center gap-1">
                            <Image
                              src="/icons/solar_hand-money-linear.svg"
                              alt="Commission"
                              width={18}
                              height={18}
                              className="opacity-60"
                            />
                            <span className="font-poppins text-[14px] font-normal text-[rgb(140,140,140)]">
                              Commission
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-[30px] rounded-[12px] bg-[rgb(248,248,248)] font-poppins text-[14px] font-normal text-black hover:bg-gray-200"
                      onPress={handleCommissionClaim}
                      isDisabled={
                        loading ||
                        (!safeInfo.setup_password_link &&
                          !safeInfo.promoter_portal) ||
                        safeInfo.revenue === 0
                      }
                    >
                      Claim
                    </Button>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowRules(true)}
                    className="font-poppins text-[14px] font-normal underline text-[rgb(140,140,140)] hover:text-black"
                  >
                    Rules
                  </button>
                  {!loading && (
                    <Link
                      href={
                        safeInfo.setup_password_link ||
                        safeInfo.promoter_portal ||
                        '#'
                      }
                      target="_blank"
                      className="font-poppins text-[14px] font-normal cursor-pointer underline text-[rgb(140,140,140)] hover:text-black"
                    >
                      Referral Management
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="rules"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col gap-6 p-8"
              >
                {/* Rules Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setShowRules(false)}
                      className="size-8 min-w-8 rounded-[20px] px-2"
                    >
                      <Icon.ArrowLeft size={20} />
                    </Button>
                    <h2 className="font-poppins text-[18px] font-medium leading-[27px] text-black">
                      Referral Program Rules
                    </h2>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={onClose}
                    className="size-8 min-w-8"
                  >
                    <Icon.X size={24} />
                  </Button>
                </div>

                {/* Rules Content */}
                <ReferralRules />
              </motion.div>
            )}
          </AnimatePresence>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
