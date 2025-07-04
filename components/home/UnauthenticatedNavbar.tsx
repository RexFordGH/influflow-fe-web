
'use client';

import { Button } from '@heroui/react';

export const UnauthenticatedNavbar = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="fixed top-0 w-full h-[50px] z-50 flex justify-between items-center px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <p className="text-[20px] font-bold leading-[1]">InfluFlow</p>
      <Button
        className="px-[24px] py-[6px] bg-[#448AFF] text-white rounded-[24px]"
        color="primary"
        variant="flat"
        onPress={onLogin}
      >
        Login
      </Button>
    </div>
  );
};
