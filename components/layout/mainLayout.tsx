'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/authStore';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {!isAuthenticated && <Topbar />}
      {children}
    </>
  );
}
