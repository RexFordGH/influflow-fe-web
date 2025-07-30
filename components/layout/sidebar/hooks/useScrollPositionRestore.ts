// useScrollPositionRestore Hook - 滚动位置保持，防止加载新数据时的跳动

import { useCallback, useEffect, useRef } from 'react';

import { SidebarItem } from '../types/sidebar.types';

interface UseScrollPositionRestoreOptions {
  enabled?: boolean; // 是否启用滚动位置保持
  threshold?: number; // 触发保持的最小滚动距离
  restoreDelay?: number; // 恢复延迟时间（ms）
}

export const useScrollPositionRestore = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  items: SidebarItem[],
  options: UseScrollPositionRestoreOptions = {},
) => {
  const { enabled = true, threshold = 50, restoreDelay = 16 } = options;

  // 保存滚动位置
  const scrollPositionRef = useRef<number>(0);

  // 保存之前的数据量，用于检测是否有新数据加载
  const previousItemCountRef = useRef<number>(0);

  // 保存最后一个可见项的ID，用于更精确的位置恢复
  const lastVisibleItemRef = useRef<string | null>(null);

  // 防抖标志，防止频繁的位置恢复
  const isRestoringRef = useRef<boolean>(false);

  // 获取当前滚动位置
  const getCurrentScrollPosition = useCallback(() => {
    return containerRef.current?.scrollTop || 0;
  }, [containerRef]);

  // 查找第一个可见的列表项
  const findFirstVisibleItem = useCallback((): string | null => {
    if (!containerRef.current) return null;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const sidebarItems = container.querySelectorAll('[data-sidebar-item-id]');

    for (const item of sidebarItems) {
      const itemRect = item.getBoundingClientRect();

      // 检查项目是否在可视区域内
      if (
        itemRect.bottom > containerRect.top &&
        itemRect.top < containerRect.bottom
      ) {
        return item.getAttribute('data-sidebar-item-id');
      }
    }

    return null;
  }, [containerRef]);

  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current) return;

    const currentPosition = getCurrentScrollPosition();

    // 只有滚动距离超过阈值时才保存
    if (currentPosition > threshold) {
      scrollPositionRef.current = currentPosition;

      // 尝试找到当前可见的第一个列表项
      const visibleItem = findFirstVisibleItem();
      if (visibleItem) {
        lastVisibleItemRef.current = visibleItem;
      }
    }
  }, [
    enabled,
    containerRef,
    getCurrentScrollPosition,
    threshold,
    findFirstVisibleItem,
  ]);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current || isRestoringRef.current) return;

    isRestoringRef.current = true;

    const restorePosition = () => {
      const container = containerRef.current;
      if (!container) {
        isRestoringRef.current = false;
        return;
      }

      let targetPosition = scrollPositionRef.current;

      // 如果有保存的可见项目ID，尝试滚动到该项目
      if (lastVisibleItemRef.current) {
        const targetItem = container.querySelector(
          `[data-sidebar-item-id="${lastVisibleItemRef.current}"]`,
        );

        if (targetItem) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = targetItem.getBoundingClientRect();
          const relativeTop = itemRect.top - containerRect.top;

          // 如果项目不在可视区域内，滚动到该项目
          if (relativeTop < 0 || relativeTop > containerRect.height) {
            targetPosition = container.scrollTop + relativeTop;
          }
        }
      }

      // 平滑滚动到目标位置
      if (Math.abs(container.scrollTop - targetPosition) > 5) {
        container.scrollTo({
          top: targetPosition,
          behavior: 'auto', // 使用 auto 而不是 smooth，避免与无限滚动冲突
        });
      }

      isRestoringRef.current = false;
    };

    // 使用 requestAnimationFrame 确保 DOM 更新完成后再恢复位置
    if (restoreDelay > 0) {
      setTimeout(() => {
        requestAnimationFrame(restorePosition);
      }, restoreDelay);
    } else {
      requestAnimationFrame(restorePosition);
    }
  }, [enabled, containerRef, restoreDelay]);

  // 监听滚动事件，保存位置
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // 节流处理滚动事件
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!isRestoringRef.current) {
          saveScrollPosition();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [enabled, containerRef, saveScrollPosition]);

  // 监听数据变化，恢复位置
  useEffect(() => {
    if (!enabled) return;

    const currentItemCount = items.length;
    const previousItemCount = previousItemCountRef.current;

    // 检测是否有新数据加载（数据量增加）
    const hasNewData =
      currentItemCount > previousItemCount && previousItemCount > 0;

    if (hasNewData) {
      // 有新数据时，恢复滚动位置
      restoreScrollPosition();
    }

    // 更新之前的数据量
    previousItemCountRef.current = currentItemCount;
  }, [enabled, items.length, restoreScrollPosition]);

  // 手动重置位置（用于刷新后）
  const resetPosition = useCallback(() => {
    scrollPositionRef.current = 0;
    lastVisibleItemRef.current = null;
    previousItemCountRef.current = 0;
    isRestoringRef.current = false;
  }, []);

  // 手动保存当前位置
  const saveCurrentPosition = useCallback(() => {
    saveScrollPosition();
  }, [saveScrollPosition]);

  // 手动恢复位置
  const restorePosition = useCallback(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  return {
    // 控制方法
    resetPosition,
    saveCurrentPosition,
    restorePosition,

    // 状态查询
    getCurrentPosition: getCurrentScrollPosition,
    getSavedPosition: () => scrollPositionRef.current,
    getLastVisibleItem: () => lastVisibleItemRef.current,
    isRestoring: () => isRestoringRef.current,
  };
};
