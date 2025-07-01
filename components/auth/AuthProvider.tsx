'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';

import { LoginModal } from './LoginModal';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoginModalOpen, closeLoginModal, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // 应用启动时检查登录状态
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </>
  );
}
