// 加载指示器组件 - 不同类型的加载状态展示

import { Skeleton } from '@heroui/react';
import React from 'react';

interface LoadingIndicatorProps {
  type?: 'initial' | 'loadMore';
  itemCount?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'initial',
  itemCount = 10,
}) => {
  if (type === 'loadMore') {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
          <span className="text-sm">Loading more...</span>
        </div>
      </div>
    );
  }

  // 初始加载骨架屏
  return (
    <div className="space-y-2">
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          <Skeleton className="size-4 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 简化版的加载骨架屏（保持向后兼容）
export const TweetThreadsSkeleton: React.FC = () => (
  <LoadingIndicator type="initial" itemCount={10} />
);
