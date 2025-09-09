'use client';

import { useEffect } from 'react';

import { useSubscriptionInfo } from '@/lib/api/services';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

/**
 * 全局订阅信息同步组件
 * 负责自动同步订阅信息到 store
 */
export const SubscriptionSync = () => {
  const { isAuthenticated } = useAuthStore();
  const { data: subscriptionInfo, refetch } =
    useSubscriptionInfo(isAuthenticated);
  const { setSubscriptionInfo } = useSubscriptionStore();

  // 同步订阅信息到 store
  useEffect(() => {
    if (subscriptionInfo) {
      setSubscriptionInfo(subscriptionInfo);
    }
  }, [subscriptionInfo, setSubscriptionInfo]);

  // 将 refetch 方法暴露到全局
  useEffect(() => {
    // 将 refetch 方法挂载到 window 对象，供全局调用
    (window as any).refetchSubscriptionInfo = refetch;

    return () => {
      delete (window as any).refetchSubscriptionInfo;
    };
  }, [refetch]);

  return null;
};
