import { useMutation, useQuery } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api/client';

// ========================
// Types
// ========================

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referrals_count: number;
  active_customers_count: number;
  referral_credits: number;
  revenue: number;
  promoter_portal?: string;
  setup_password_link?: string | null;
}

export interface ClaimCreditsResponse {
  success: boolean;
  credits_claimed?: number;
  current_credits?: number;
}

export interface CheckReferralCodeResponse {
  valid: boolean;
}

export interface SignUpRequest {
  referral_code?: string;
}

// ========================
// Query Keys
// ========================

export const REFERRAL_QUERY_KEYS = {
  REFERRAL_INFO: ['referral', 'info'] as const,
  CHECK_REFERRAL_CODE: ['referral', 'check-code'] as const,
} as const;

// ========================
// Hooks
// ========================

// 获取推荐信息
export function useReferralInfo() {
  return useQuery({
    queryKey: REFERRAL_QUERY_KEYS.REFERRAL_INFO,
    queryFn: () => apiGet<ReferralInfo>('/api/user/referral-info'),
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟缓存
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

// 领取推荐积分
export function useClaimReferralCredits() {
  return useMutation({
    mutationFn: async () => {
      return apiPost<void>('/api/claim-referral-credit', {});
    },
    onSuccess: (data) => {
      console.log('Credits claimed successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to claim credits:', error);
    },
  });
}

// 检查推荐码是否有效
export function useCheckReferralCode() {
  return useMutation({
    mutationFn: async (referralCode: string) => {
      return apiPost<CheckReferralCodeResponse>('/api/check-referral-code', {
        referral_code: referralCode,
      });
    },
    onSuccess: (data) => {
      console.log('Referral code checked:', data);
    },
    onError: (error) => {
      console.error('Failed to check referral code:', error);
    },
  });
}

// 注册用户
export function useSignUp() {
  return useMutation({
    mutationFn: async (data: SignUpRequest) => {
      return apiPost<void>('/api/sign-up', data);
    },
    onSuccess: () => {
      console.log('User signed up successfully');
    },
    onError: (error) => {
      console.error('Failed to sign up:', error);
    },
  });
}

// ========================
// 原始函数（保留用于非组件环境）
// ========================

export async function getReferralInfo(): Promise<ReferralInfo> {
  return apiGet<ReferralInfo>('/api/user/referral-info');
}

export async function claimReferralCredits(): Promise<ClaimCreditsResponse> {
  return apiPost<ClaimCreditsResponse>('/api/claim-referral-credit', {});
}

export async function checkReferralCode(
  referral_code: string,
): Promise<CheckReferralCodeResponse> {
  return apiPost<CheckReferralCodeResponse>('/api/check-referral-code', {
    referral_code,
  });
}

export async function signUp(data: { referral_code?: string }): Promise<void> {
  return apiPost<void>('/api/sign-up', data);
}
