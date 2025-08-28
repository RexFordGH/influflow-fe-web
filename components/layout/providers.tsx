'use client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { AuthProvider } from '@/components/auth/AuthProvider';
import NoCreditsModal from '@/components/modals/NoCreditsModal';
import { SubscriptionSync } from '@/components/subscription/SubscriptionSync';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showNoCreditsModal, setShowNoCreditsModal } = useSubscriptionStore();
  
  return (
    <HeroUIProvider navigate={router.push}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider
          placement={'bottom-center'}
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
        <SubscriptionSync />
        <NoCreditsModal 
          isOpen={showNoCreditsModal} 
          onClose={() => setShowNoCreditsModal(false)} 
        />
      </QueryClientProvider>
    </HeroUIProvider>
  );
}
