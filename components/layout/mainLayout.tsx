'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/authStore';
import { usePathname } from 'next/navigation';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // 不在首页显示 Topbar
  const isHomePage = pathname === '/';

  return (
    <>
      {!isAuthenticated && !isHomePage && <Topbar />}
      {children}
    </>
  );
}
