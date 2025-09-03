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
          'fixed left-0 z-10 flex h-screen w-[320px] flex-col border-gray-200 bg-[#FAFAFA] transition-transform duration-300',
          showLowCreditsBanner ? 'pt-[36px]' : '',
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            {/* <ProfileDropdown collapsed={collapsed} /> */}
            <Image src={'/icons/influxy.svg'} width={105} height={29} />
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

        <div className="px-3 pb-3">
          {/*Invite to Earn*/}
          <Button
            className="w-full h-[37px] rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-none shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              background:
                'linear-gradient(90deg, #478afe 0%, #a392d1 50%, #fd999d 100%)',
            }}
            onPress={() => setShowReferralModal(true)}
          >
            <div className="flex items-center gap-3">
              <Image
                src={'/icons/add_account.svg'}
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
              <span className="text-[14px] font-medium leading-[21px] text-white">
                Invite to Earn
              </span>
            </div>
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-y-auto scrollbar-hide"
          id="sidebar-scroll-container"
        >
          <div className="ml-3 mr-3">
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

        <div className="w-full px-[12px] flex items-center justify-between h-[61px]">
          <ProfileDropdown collapsed={collapsed} />

          <Link
            id="customize-my-style"
            href="/profile"
            className="flex items-center justify-center gap-[10px] rounded-[12px] bg-[#f0f0f0] hover:bg-[#c1c1c1] w-[84px] h-[37px]"
          >
            <Image
              src="/icons/enhancement.svg"
              width={16}
              height={16}
              className="rounded-none"
            />
            <span className="text-[14px]  text-black">Style</span>
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
