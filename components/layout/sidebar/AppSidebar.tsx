'use client';

import { Button, cn, Image } from '@heroui/react';
import * as Icon from '@phosphor-icons/react';
import Link from 'next/link';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { ReferralModal } from '@/components/referral';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

import {
  EmptyState,
  EndOfList,
  ErrorMessage,
  LoadingIndicator,
  SidebarItem,
} from './components';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { usePaginatedData } from './hooks/usePaginatedData';
import { useScrollPositionRestore } from './hooks/useScrollPositionRestore';
import { ProfileDropdown } from './ProfileDropdown';
import { SidebarItem as SidebarItemType } from './types/sidebar.types';

interface AppSidebarProps {
  onItemClick?: (item: SidebarItemType) => void;
  selectedId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface AppSidebarRef {
  refresh: () => Promise<void>;
}

export const AppSidebar = forwardRef<AppSidebarRef, AppSidebarProps>(
  ({ onItemClick, selectedId, collapsed = false, onToggleCollapse }, ref) => {
    const { user, isAuthenticated } = useAuthStore();
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);

    const { showLowCreditsBanner } = useSubscriptionStore();

    // 滚动容器引用
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 使用分页数据Hook
    const {
      data: items,
      error,
      hasMore,
      loadMore,
      refresh,
      isLoadingMore,
      isEmpty,
      retry,
      isInitialLoading,
    } = usePaginatedData({
      userId: user?.id || '',
      pageSize: 50,
    });

    // 使用无限滚动Hook
    const { reset: resetInfiniteScroll } = useInfiniteScroll(
      scrollContainerRef,
      {
        onLoadMore: loadMore,
        hasMore,
        threshold: 100,
        loading: isLoadingMore,
      },
    );

    // 使用滚动位置保持Hook
    const { resetPosition: resetScrollPosition, saveCurrentPosition } =
      useScrollPositionRestore(scrollContainerRef, items, {
        enabled: true,
        threshold: 50,
        restoreDelay: 16,
      });

    const handleItemClick = (item: SidebarItemType) => {
      if (onItemClick) {
        onItemClick(item);
      }
    };

    const handleRefresh = async () => {
      // 保存当前滚动位置
      saveCurrentPosition();

      await refresh();

      // 重置无限滚动状态
      resetInfiniteScroll();

      // 重置滚动位置（刷新后回到顶部）
      resetScrollPosition();
    };

    // 暴露刷新方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: handleRefresh,
      }),
      [handleRefresh],
    );

    if (!isAuthenticated) {
      return null;
    }

    return (
      <div
        className={cn(
          'fixed left-0 z-10 flex h-screen w-[320px] flex-col border-r border-gray-200 bg-[#FAFAFA] transition-transform duration-300',
          showLowCreditsBanner ? 'pt-[36px]' : '',
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <ProfileDropdown collapsed={collapsed} />

            {/* 收起按钮 */}
            {onToggleCollapse && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onToggleCollapse}
                className="text-gray-500 hover:text-gray-700"
                aria-label="收起侧边栏"
              >
                <Image
                  src="/icons/doubleArrowRounded.svg"
                  width={24}
                  height={24}
                />
              </Button>
            )}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-y-auto"
          id="sidebar-scroll-container"
        >
          <div className="p-4">
            {/* 内容区域 */}
            {isInitialLoading ? (
              <LoadingIndicator type="initial" itemCount={10} />
            ) : error ? (
              <ErrorMessage error={new Error(error!)} onRetry={retry} />
            ) : isEmpty ? (
              <EmptyState
                title="No content yet"
                description="There are no tweets yet, start creating your first content"
              />
            ) : (
              <div className="">
                {/* 列表项 */}
                {items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                    isSelected={selectedId === item.id}
                  />
                ))}

                {/* 无限滚动状态指示器 */}
                {isLoadingMore && <LoadingIndicator type="loadMore" />}

                {/* 没有更多数据提示 */}
                {!hasMore && items.length > 0 && <EndOfList />}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 px-[24px] py-[12px]">
          <button
            onClick={() => setShowReferralModal(true)}
            className="flex items-center justify-center gap-[10px] rounded-[12px] bg-black px-[12px] py-[8px] hover:bg-[#c1c1c1]"
          >
            <Icon.Gift size={16} className="text-white" />
            <span className="text-[14px] leading-[21px] text-white">
              Invite to Earn
            </span>
          </button>

          <Link
            id="customize-my-style"
            href="/profile"
            className="flex items-center justify-center gap-[10px] rounded-[12px] bg-[#EFEFEF] px-[12px] py-[8px] hover:bg-[#c1c1c1]"
          >
            <Image
              src="/icons/enhancement.svg"
              width={16}
              height={16}
              className="rounded-none"
            />
            <span className="text-[14px] leading-[21px] text-black">
              Customize My Style
            </span>
          </Link>
        </div>

        {/* Referral Modals */}
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
        />
      </div>
    );
  },
);

AppSidebar.displayName = 'AppSidebar';
