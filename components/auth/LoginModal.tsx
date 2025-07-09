'use client';

import {
  Button,
  Image,
  InputOtp,
  Link,
  Modal,
  ModalBody,
  ModalContent,
} from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';

import { verifyInvitationCode } from '@/lib/api/services';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  authError?: string | null;
}

export function LoginModal({ isOpen, onClose, authError }: LoginModalProps) {
  const [invitationCode, setInvitationCode] = useState('');
  const [showExistingUserLogin, setShowExistingUserLogin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // 处理外部传入的认证错误
  useEffect(() => {
    if (authError) {
      setError(authError);
      setShowExistingUserLogin(false); // 显示新用户登录界面以便看到错误
    }
  }, [authError]);

  const onOTPChange = useCallback((value: string) => {
    setInvitationCode(value);
    setError('');
  }, []);

  const handleNewUserLogin = async () => {
    if (invitationCode.length !== 6) {
      setError('Please enter a 6-digit invitation code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyInvitationCode(invitationCode);

      if (!result.valid) {
        setError(result.error || 'Invalid invitation code');
        setIsVerifying(false);
        return;
      }

      // 邀请码验证通过，跳转到Twitter登录并附带邀请码
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?invitation_code=${encodeURIComponent(invitationCode.trim())}`,
        },
      });

      if (error) {
        console.error('Twitter login error:', error);
        setError('登录失败，请重试');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('网络错误，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExistingUserLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Twitter login error:', error);
      setError('登录失败，请重试');
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
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                Welcome to Influxy
              </h1>
            </div>

            {!showExistingUserLogin ? (
              /* 新用户邀请码登录 */
              <div className="space-y-6">
                {/* 邀请码输入区域 */}
                <div className="space-y-4 flex flex-col items-center">
                  <div className="text-center">
                    <p className="mb-3 text-[16px] font-[500] text-gray-700">
                      Please enter your invitation code
                    </p>
                  </div>
                  <InputOtp
                    length={6}
                    value={invitationCode}
                    onValueChange={onOTPChange}
                    variant="bordered"
                    size="lg"
                    allowedKeys="^[a-zA-Z0-9]*$"
                    classNames={{
                      base: 'flex justify-center',
                      segment:
                        'w-12 h-12 text-lg font-semibold border-gray-300',
                    }}
                  />

                  {error && (
                    <p className="text-center text-sm text-red-500">{error}</p>
                  )}
                </div>

                {/* <Divider className="my-6" /> */}

                {/* Twitter 登录按钮区域 */}
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
                    onPress={handleNewUserLogin}
                    isDisabled={invitationCode.length !== 6 || isVerifying}
                    isLoading={isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify and Login with X'}
                  </Button>

                  <div className="text-center">
                    <Link
                      className="cursor-pointer text-sm text-blue-600 opacity-50 hover:opacity-100 hover:underline"
                      onPress={() => setShowExistingUserLogin(true)}
                    >
                      Already have an account? Login
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* 老用户直接登录 */
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
                  onPress={handleExistingUserLogin}
                >
                  Continue with X
                </Button>

                <div className="text-center">
                  <Link
                    className="cursor-pointer text-sm text-blue-600 opacity-50 hover:opacity-100 hover:underline"
                    onPress={() => setShowExistingUserLogin(false)}
                  >
                    Register a new account
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
