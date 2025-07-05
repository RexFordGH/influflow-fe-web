'use client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { AuthProvider } from '@/components/auth/AuthProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider
          placement={'bottom-left'}
          toastOffset={20}
          toastProps={{
            classNames: {
              base: 'max-w-[350px]',
              content: 'min-w-0',
              wrapper: 'min-w-0',
              title: 'break-words whitespace-normal',
              description: 'break-words whitespace-normal',
            },
            variant: 'flat',
          }}
          regionProps={{
            classNames: {
              base: 'z-[1500]',
            },
          }}
        />
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </HeroUIProvider>
  );
}
