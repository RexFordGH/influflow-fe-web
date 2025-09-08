'use client';

import {
  Button,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalContent,
} from '@heroui/react';
import { useEffect, useState } from 'react';

import { DevEmailAuth } from '@/components/auth/DevEmailAuth';
import { showEmailAuth } from '@/constants/env';
import { useRedirect } from '@/hooks/useRedirect';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  authError?: string | null;
}

export function LoginModal({ isOpen, onClose, authError }: LoginModalProps) {
  const [showExistingUserLogin, setShowExistingUserLogin] = useState(true); // 默认显示登录
  const [error, setError] = useState('');
  const { getAuthCallbackUrl } = useRedirect();

  // 处理外部传入的认证错误
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // 统一的 Twitter 登录处理函数
  const handleTwitterAuth = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      console.error('Twitter login error:', error);
      setError('Auth failed, please retry.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      classNames={{
        backdrop: 'bg-white',
        base: 'border-none shadow-2xl',
        body: 'p-0',
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="rounded-2xl bg-white p-8">
            {/* 品牌Logo区域 */}
            <div className="mb-8 text-left">
              <p className="text-[20px] font-bold text-black/60">
                Welcome to Influxy
              </p>
              <p className="text-[24px] font-bold text-black">
                {showExistingUserLogin
                  ? 'Transform your ideas into posts, In seconds.'
                  : 'Join Influxy and start creating'}
              </p>
            </div>

            {error && (
              <p className="mb-4 text-center text-sm text-red-500">{error}</p>
            )}

            {showExistingUserLogin ? (
              /* 已有用户登录 */
              <div className="space-y-4">
                <Button
                  className="h-12 w-full border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                  startContent={
                    <Image
                      src="/icons/twitter.svg"
                      alt="X"
                      width={20}
                      height={20}
                    />
                  }
                  onPress={handleTwitterAuth}
                >
                  Continue with X
                </Button>

                {showEmailAuth && (
                  <div className="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                      开发环境专用 · Email 登录
                    </p>
                    <DevEmailAuth mode="login" />
                  </div>
                )}

                <div className="text-center">
                  <Link
                    className="cursor-pointer text-sm text-blue-600 opacity-50 hover:underline hover:opacity-100"
                    onPress={() => setShowExistingUserLogin(false)}
                  >
                    Don't have an account? Register
                  </Link>
                </div>
              </div>
            ) : (
              /* 新用户注册 */
              <div className="space-y-4">
                <Button
                  className="h-12 w-full border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                  startContent={
                    <Image
                      src="/icons/twitter.svg"
                      alt="X"
                      width={20}
                      height={20}
                    />
                  }
                  onPress={handleTwitterAuth}
                >
                  Sign up with X
                </Button>

                {showEmailAuth && (
                  <div className="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                      开发环境专用 · Email 注册
                    </p>
                    <DevEmailAuth mode="register" />
                  </div>
                )}

                <div className="text-center">
                  <Link
                    className="cursor-pointer text-sm text-blue-600 opacity-50 hover:underline hover:opacity-100"
                    onPress={() => setShowExistingUserLogin(true)}
                  >
                    Already have an account? Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
