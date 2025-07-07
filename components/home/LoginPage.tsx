'use client';

import { Button } from '@heroui/react';

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
          {/* 品牌Logo区域 */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Login to Influxy
            </h1>
            <p className="text-gray-600">
              Transform your ideas into posts in seconds.
            </p>
          </div>

          {/* 登录按钮 */}
          <div className="space-y-4">
            <Button
              className="h-12 w-full border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
              startContent={
                <svg className="size-5" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              }
              onPress={handleTwitterLogin}
            >
              Continue with Twitter
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
