'use client';

import { Button, Image } from '@heroui/react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DevEmailAuth } from '@/components/auth/DevEmailAuth';
import { Topbar } from '@/components/layout/Topbar';
import { showEmailAuth } from '@/constants/env';
import { useCheckReferralCode } from '@/lib/api/referral';
import { createClient } from '@/lib/supabase/client';

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
}

export default function ReferralLandingPage() {
  const params = useParams<{ referral_code: string }>();
  const supabase = createClient();

  const referralCode = decodeURIComponent(params.referral_code || '');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  const { mutateAsync: checkReferralCodeAsync, isPending: isVerifying } =
    useCheckReferralCode();

  useEffect(() => {
    if (!referralCode) {
      setError('Invalid referral code');
      return;
    }

    // Store referral code to Cookie and localStorage
    setCookie('ifw_referral_code', referralCode);
    window.localStorage.setItem('ifw_referral_code_v1', referralCode);

    // Verify referral code in background
    const verifyCode = async () => {
      try {
        const result = await checkReferralCodeAsync(referralCode);
        setCanRegister(result.valid);
        if (!result.valid) {
          setError('Invalid or expired referral code');
        }
      } catch (err) {
        console.error('Failed to verify referral code:', err);
        setCanRegister(false);
      }
    };

    verifyCode();
  }, [referralCode, checkReferralCodeAsync]);

  const handleTwitterLogin = async () => {
    setIsLoading(true);
    setError('');

    const next = '/';
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL!;
    const redirectTo = `${origin}/api/auth/referral/callback/${encodeURIComponent(referralCode)}?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: { redirectTo },
    });

    if (error) {
      console.error('Twitter login failed:', error);
      setError('Login failed, please try again');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Topbar without Login button */}
      <Topbar showLogin={false} />

      {/* Main Content */}
      <main className="m-auto flex w-[544px] flex-col items-center justify-center pt-[50px]">
        <div className="flex w-full flex-col gap-8 text-center">
          <div className="mb-8 text-left">
            <p className="text-[24px] font-bold text-[#8C8C8C]">
              Welcome to Influxy
            </p>
            <p className="text-[32px] font-bold text-black">
              Transform your ideas into posts, <br /> In seconds.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>
        {/* Register Button */}
        <Button
          className="h-12 w-[544px] border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          startContent={
            <Image src="/icons/twitter.svg" alt="X" width={24} height={24} />
          }
          onPress={handleTwitterLogin}
          isLoading={isLoading}
          isDisabled={isLoading || !canRegister || isVerifying}
        >
          {isLoading ? 'Processing...' : 'Verify and Login with X'}
        </Button>

        {/* 开发环境：提供邮箱注册/登录用于测试 */}
        {showEmailAuth && (
          <div className="mt-6 w-[544px] space-y-4">
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
              <p className="text-xs text-gray-500">
                开发环境专用 · Email 注册（将绑定当前邀请码 {referralCode}）
              </p>
              <DevEmailAuth mode="register" referralCode={referralCode} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
