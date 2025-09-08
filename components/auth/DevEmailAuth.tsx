'use client';

import { Button, Input } from '@heroui/react';
import { useMemo, useState } from 'react';

import { showEmailAuth } from '@/constants/env';
import { useRedirect } from '@/hooks/useRedirect';
import { createClient } from '@/lib/supabase/client';

interface DevEmailAuthProps {
  mode: 'login' | 'register';
  referralCode?: string; // 当处于邀请落地页时，回调到 referral callback，实现与 Twitter 一致的逻辑
}

export function DevEmailAuth({ mode, referralCode }: DevEmailAuthProps) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');

  const { getAuthCallbackUrl } = useRedirect();

  const callbackUrl = useMemo(() => {
    if (referralCode) {
      return getAuthCallbackUrl('referral', { referralCode, next: '/' });
    }
    return getAuthCallbackUrl();
  }, [referralCode, getAuthCallbackUrl]);

  if (!showEmailAuth) return null; // 生产环境不显示

  const handleSubmit = async () => {
    setPending(true);
    setError('');
    setInfo('');
    try {
      const supabase = createClient();

      // 使用邮件 Magic Link，确保通过回调路由完成会话交换与后续逻辑（与 Twitter 一致）
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'register', // 注册：允许创建；登录：仅登录已存在用户
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        setError(
          `${mode === 'register' ? '注册' : '登录'}失败：${error.message}`,
        );
        return;
      }

      // signInWithOtp 不会立刻有会话；提示用户检查邮箱
      setInfo(
        mode === 'register'
          ? '验证邮件已发送，请前往邮箱完成验证后自动登录'
          : '登录链接已发送，请前往邮箱点击链接完成登录',
      );
    } catch (e: any) {
      setError(
        `${mode === 'register' ? '注册' : '登录'}失败：${e?.message || '未知错误'}`,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {info && <p className="text-sm text-green-600">{info}</p>}
      <Input
        type="email"
        label="Email"
        size="sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        className="w-full"
        isDisabled={pending || !email}
        onPress={handleSubmit}
        isLoading={pending}
      >
        {mode === 'register' ? 'Sign Up' : 'Sign In'}
      </Button>
    </div>
  );
}
