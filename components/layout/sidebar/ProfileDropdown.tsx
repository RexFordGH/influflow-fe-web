'use client';

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/stores/authStore';

interface ProfileDropdownProps {
  collapsed?: boolean;
}

export const ProfileDropdown = ({ collapsed }: ProfileDropdownProps) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // 暂时写死 credits
  const credits = 1430;

  const handleLogout = () => {
    logout();
  };

  const handleManageSubscription = () => {
    router.push('/subscription');
  };

  const handleCustomizeStyle = () => {
    router.push('/profile');
  };

  if (collapsed) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-start"
      classNames={{
        content: 'min-w-[226px] p-0',
      }}
    >
      <DropdownTrigger>
        <div className="flex cursor-pointer items-center justify-between rounded-[12px] px-[12px] py-[8px] transition-colors hover:bg-[#EFEFEF]">
          <div className="flex items-center gap-2">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt="User Avatar"
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div
                className="size-6 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                }}
              />
            )}
            <span
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                color: '#000000',
              }}
            >
              {user?.name || 'Influxy User'}
            </span>
          </div>
          <Image
            src={'/icons/lsicon_down-outline.svg'}
            width={16}
            height={16}
          />
        </div>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Profile actions"
        className="w-full p-2"
        itemClasses={{
          base: 'p-0',
        }}
      >
        <DropdownItem key="credits" isReadOnly textValue="Credits">
          <div className="flex items-center justify-between rounded-[6px] bg-[#F7F7F7] p-[12px]">
            <span className="font-poppins text-[12px] text-black">Credits</span>
            <span className="font-poppins text-[16px] font-[600] text-black">
              {credits}
            </span>
          </div>
        </DropdownItem>

        {/* Menu Items */}
        <DropdownItem
          key="subscription"
          onClick={handleManageSubscription}
          className="data-[hover=true]:bg-gray-100"
          textValue="Manage Subscription"
        >
          <div className="flex items-center gap-[8px] px-[12px] py-[6px]">
            <Image src="/icons/profile.svg" width={16} height={16} />
            <span className="font-poppins text-[14px] text-black">
              Manage Subscription
            </span>
          </div>
        </DropdownItem>

        <DropdownItem key="divider-1">
          <div className="w-full border-t border-black/10"></div>
        </DropdownItem>

        <DropdownItem
          key="customize"
          onClick={handleCustomizeStyle}
          className="data-[hover=true]:bg-gray-100"
          textValue="Customize My Style"
        >
          <div className="flex items-center gap-[8px] px-[12px] py-[6px] ">
            {/* <Image src="/icons/profile.svg" width={16} height={16} /> */}
            <Image
              src="/icons/pajamas_work-item-enhancement.svg"
              width={16}
              height={16}
              className="rounded-none"
            />
            <span className="font-poppins text-[14px] text-black">
              Customize My Style
            </span>
          </div>
        </DropdownItem>

        <DropdownItem key="divider-2">
          <div className="w-full border-t border-black/10"></div>
        </DropdownItem>

        <DropdownItem
          key="logout"
          onClick={handleLogout}
          className="data-[hover=true]:bg-gray-100"
          textValue="Log Out"
        >
          <div className="flex items-center gap-[8px] px-[12px] py-[6px]">
            <Image src="/icons/Logout.svg" width={16} height={16} />
            <span className="font-poppins text-[14px] text-black">Log Out</span>
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
