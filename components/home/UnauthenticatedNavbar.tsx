'use client';

import { Button } from '@heroui/react';

export const UnauthenticatedNavbar = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="fixed top-0 z-50 flex h-[50px] w-full items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-sm">
      <p className="text-[20px] font-bold leading-none">InfluFlow</p>
      <Button
        className="rounded-[24px] bg-[#448AFF] px-[24px] py-[6px] text-white"
        color="primary"
        variant="flat"
        onPress={onLogin}
      >
        Login
      </Button>
    </div>
  );
};
