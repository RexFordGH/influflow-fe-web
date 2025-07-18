'use client';

import { useRouter } from 'next/navigation';

import { ProfilePage } from '@/components/profile/ProfilePage';

export default function Profile() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.back();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`flex-1 transition-all duration-300`}>
        <ProfilePage onBack={handleBackToHome} />
      </div>
    </div>
  );
}
