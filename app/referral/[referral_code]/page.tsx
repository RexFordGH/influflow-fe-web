'use client';

import { Button, Image } from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Topbar } from '@/components/layout/Topbar';
import { useCheckReferralCode } from '@/lib/api/referral';
import { createClient } from '@/lib/supabase/client';

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
}

export default function ReferralLandingPage() {
  const params = useParams<{ referral_code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const referralCode = decodeURIComponent(params.referral_code || '');

  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  const { mutateAsync: checkReferralCodeAsync, isPending: isVerifying } = useCheckReferralCode();

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
        setIsValid(result.valid);
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
    const redirectTo = `${window.location.origin}/api/auth/referral/callback/${encodeURIComponent(referralCode)}?next=${encodeURIComponent(next)}`;

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
      <main className="m-auto w-[544px] flex flex-col items-center justify-center pt-[50px]">
        <div className="flex w-full flex-col gap-8 text-center">
          <div className="mb-8 text-left">
            <p className="text-[24px] font-bold text-[#8C8C8C]">
              Welcome to Influxy
            </p>
            <p className="text-[32px] font-bold text-black">
              Transform your ideas into posts, <br /> In seconds.
            </p>
          </div>

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
      </main>
    </div>
  );
}
