'use client';

import { Button, Image } from '@heroui/react';

import { createClient } from '@/lib/supabase/client';

export const LoginPage = ({ onBack }: { onBack: () => void }) => {
  const handleTwitterLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Twitter login error:', error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-[12px]">
            <p className="text-[20px] font-[600] leading-none text-[#8C8C8C]">
              Welcome to Influxy
            </p>
            <div className="text-[24px] font-[600] leading-[1.2] text-black">
              <p>Transform your ideas into posts,</p>
              <p>In seconds</p>
            </div>
          </div>

          {/* 登录按钮 */}
          <div className="mt-[32px]">
            <Button
              className="flex w-full items-center justify-start gap-2 rounded-[12px] border border-gray-300 bg-white p-[24px] hover:bg-gray-50"
              onPress={handleTwitterLogin}
            >
              <Image src="/icons/x.svg" alt="X" width={24} height={24} />
              <span className="text-[18px] font-[500] text-[#8C8C8C]">
                Continue with X
              </span>
            </Button>
          </div>

          {/* 返回按钮 */}
          <div className="mt-6 text-center">
            <Button
              variant="light"
              onPress={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
