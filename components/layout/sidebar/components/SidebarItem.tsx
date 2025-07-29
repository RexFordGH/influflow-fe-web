// 简化版 SidebarItem 组件 - 轻量优雅的列表项展示

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { SidebarItemProps } from '../types/sidebar.types';

export const SidebarItem: React.FC<SidebarItemProps> = React.memo(
  ({ item, onClick, isSelected = false }) => {
    const handleClick = () => {
      onClick(item);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        });
      }
    };

    return (
      <div
        className={`
          group flex h-[40px] cursor-pointer items-center justify-between rounded-[8px] px-[8px] py-[2px]
          transition-all duration-200 ease-in-out hover:bg-[#E8E8E8]
          hover:shadow-sm
          ${isSelected ? 'border-l-3 border-blue-500 bg-blue-50' : ''}
        `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`选择 ${item.title}`}
        data-sidebar-item-id={item.id}
        data-testid={`sidebar-item-${item.id}`}
      >
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          {/* 文档图标 */}
          <div className="shrink-0">
            <DocumentTextIcon
              className={`
                size-4 transition-colors duration-200
                ${isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
              `}
            />
          </div>

          {/* 内容区域 */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 标题 */}
            <h3
              className={`
                truncate text-sm font-medium transition-colors duration-200
                ${isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-gray-800'}
              `}
              title={item.title}
            >
              {item.title}
            </h3>

            {/* 时间信息 */}
            {/* <p 
              className={`
                mt-0.5 text-xs transition-colors duration-200
                ${isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'}
              `}
            >
              {formatDate(item.updatedAt || item.createdAt)}
            </p> */}
          </div>
        </div>

        {/* 选中指示器 */}
        {isSelected && (
          <div className="ml-2 shrink-0">
            <div className="size-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 优化渲染性能的比较函数
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.updatedAt === nextProps.item.updatedAt &&
      prevProps.isSelected === nextProps.isSelected
    );
  },
);

SidebarItem.displayName = 'SidebarItem';
