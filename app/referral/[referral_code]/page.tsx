'use client';

import { Button, Image } from '@heroui/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [hasChecked, setHasChecked] = useState(false);

  const { mutateAsync: checkReferralCodeAsync, isPending: isVerifying } = useCheckReferralCode();

  useEffect(() => {
    if (!referralCode) {
      setError('Invalid referral code');
      setHasChecked(true);
      return;
    }

    // Store referral code to Cookie and localStorage
    setCookie('ifw_referral_code', referralCode);
    window.localStorage.setItem('ifw_referral_code_v1', referralCode);

    // Verify referral code
    const verifyCode = async () => {
      try {
        const result = await checkReferralCodeAsync(referralCode);
        setIsValid(result.valid);
        if (!result.valid) {
          setError('Invalid or expired referral code');
        }
      } catch (err) {
        console.error('Failed to verify referral code:', err);
        setError('Network error, please try again later');
      } finally {
        setHasChecked(true);
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

  if (!hasChecked || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto size-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
          </div>
          <p className="text-gray-600">Verifying referral code...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">
              Invalid Referral Code
            </h1>
            <p className="mb-6 text-gray-600">{error}</p>
            <Button color="primary" size="lg" onPress={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex h-14 items-center px-6">
        <h1 className="font-poppins text-[20px] font-bold text-black">
          Influxy
        </h1>
      </header>

      {/* Main Content */}
      <main className="m-auto w-[544px] flex flex-col items-center justify-center">
        <div className="flex w-full flex-col gap-8 text-center">
          <div className="mb-8 text-left">
            <p className="text-[24px] font-bold text-[#8C8C8C]">
              Welcome to Influxy
            </p>
            <p className="text-[32px] font-bold text-black">
              Transform your ideas into posts, <br /> In seconds.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        {/* Register Button */}
        <Button
          className="h-12 w-[544px] border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
          startContent={
            <Image src="/icons/twitter.svg" alt="X" width={24} height={24} />
          }
          onPress={handleTwitterLogin}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Verify and Login with X'}
        </Button>
      </main>
    </div>
  );
}
