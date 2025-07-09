'use client';

import { useAuthStore } from '@/stores/authStore';
import { Topbar } from '@/components/layout/Topbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {!isAuthenticated && <Topbar />}
      {children}
    </>
  );
}
