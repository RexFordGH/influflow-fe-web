'use client';

import { useRouter } from 'next/navigation';

import { SubscriptionPage } from '@/components/subscription/SubscriptionPage';

export default function Subscription() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.back();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 transition-all duration-300">
        <SubscriptionPage onBack={handleBackToHome} />
      </div>
    </div>
  );
}