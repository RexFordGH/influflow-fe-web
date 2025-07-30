// useInfiniteScroll Hook - 基于 IntersectionObserver 的无限滚动实现

import { useCallback, useEffect, useRef } from 'react';

import { UseInfiniteScrollOptions } from '../types/sidebar.types';

export const useInfiniteScroll = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseInfiniteScrollOptions,
) => {
  const { onLoadMore, hasMore, threshold = 100, loading = false } = options;

  // 观察器实例引用
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 哨兵元素引用
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 防抖标志，防止快速触发
  const isTriggeredRef = useRef(false);

  // 最后触发时间，用于节流
  const lastTriggerTimeRef = useRef(0);

  // 创建哨兵元素
  const createSentinel = useCallback(() => {
    if (sentinelRef.current) {
      return sentinelRef.current;
    }

    const sentinel = document.createElement('div');
    sentinel.style.cssText = `
      height: 1px;
      width: 100%;
      position: relative;
      pointer-events: none;
      opacity: 0;
    `;
    sentinel.setAttribute('data-testid', 'infinite-scroll-sentinel');
    sentinel.setAttribute('aria-hidden', 'true');

    sentinelRef.current = sentinel;
    return sentinel;
  }, []);

  // 清理哨兵元素
  const cleanupSentinel = useCallback(() => {
    if (sentinelRef.current && sentinelRef.current.parentNode) {
      sentinelRef.current.parentNode.removeChild(sentinelRef.current);
      sentinelRef.current = null;
    }
  }, []);

  // 处理交叉观察回调
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      // 检查是否满足触发条件
      if (!entry.isIntersecting || !hasMore || loading) {
        return;
      }

      // 节流控制 - 防止过于频繁的触发
      const now = Date.now();
      const timeSinceLastTrigger = now - lastTriggerTimeRef.current;
      const minInterval = 1000; // 最小间隔1秒

      if (timeSinceLastTrigger < minInterval) {
        return;
      }

      // 防抖控制 - 防止重复触发
      if (isTriggeredRef.current) {
        return;
      }

      // 执行加载更多
      isTriggeredRef.current = true;
      lastTriggerTimeRef.current = now;

      // 延迟执行，确保状态更新
      const executeLoadMore = async () => {
        try {
          await onLoadMore();
        } catch (error) {
          console.error('无限滚动加载失败:', error);
        } finally {
          // 重置防抖标志，允许下次触发
          setTimeout(() => {
            isTriggeredRef.current = false;
          }, 500);
        }
      };

      executeLoadMore();
    },
    [onLoadMore, hasMore, loading],
  );

  // 初始化观察器
  const setupObserver = useCallback(() => {
    if (!containerRef.current || !hasMore) {
      return;
    }

    // 清理旧的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建新的观察器
    const observerOptions: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerOptions,
    );

    // 创建并插入哨兵元素
    const sentinel = createSentinel();
    containerRef.current.appendChild(sentinel);

    // 开始观察
    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanupSentinel();
    };
  }, [
    containerRef,
    hasMore,
    threshold,
    handleIntersection,
    createSentinel,
    cleanupSentinel,
  ]);

  // 主要的副作用 - 设置和清理观察器
  useEffect(() => {
    if (!hasMore) {
      // 如果没有更多数据，清理观察器
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      cleanupSentinel();
      return;
    }

    // 延迟设置观察器，确保 DOM 已准备好
    const timeoutId = setTimeout(() => {
      const cleanup = setupObserver();
      return cleanup;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanupSentinel();
    };
  }, [hasMore, setupObserver, cleanupSentinel]);

  // 监听容器变化，重新设置观察器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 监听容器大小变化，重新设置观察器
    const resizeObserver = new ResizeObserver(() => {
      if (hasMore && observerRef.current && sentinelRef.current) {
        // 重新观察哨兵元素
        observerRef.current.unobserve(sentinelRef.current);
        observerRef.current.observe(sentinelRef.current);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, hasMore]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      cleanupSentinel();
      isTriggeredRef.current = false;
    };
  }, [cleanupSentinel]);

  // 返回控制方法和状态
  return {
    // 手动触发加载更多（用于调试或特殊情况）
    triggerLoadMore: useCallback(() => {
      if (hasMore && !loading && !isTriggeredRef.current) {
        handleIntersection([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      }
    }, [hasMore, loading, handleIntersection]),

    // 重置状态（用于刷新后）
    reset: useCallback(() => {
      isTriggeredRef.current = false;
      lastTriggerTimeRef.current = 0;
    }, []),

    // 获取哨兵元素（用于测试）
    getSentinel: () => sentinelRef.current,

    // 检查是否正在观察
    isObserving: () => observerRef.current !== null,
  };
};
