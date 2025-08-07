// usePaginatedData Hook - 分页数据获取和状态管理

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchPaginatedSidebarData,
  getErrorRecoveryAction,
  preloadNextPage,
  refreshSidebarData,
  SidebarAPIError,
} from '../api/sidebar.api';
import {
  SidebarItem,
  UsePaginatedDataOptions,
  UsePaginatedDataReturn,
} from '../types/sidebar.types';

export const usePaginatedData = (
  options: UsePaginatedDataOptions,
): UsePaginatedDataReturn => {
  const { userId, pageSize = 20, initialPage = 1 } = options;

  // 状态管理
  const [data, setData] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  // 用于取消请求的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 防止重复请求的标志
  const isLoadingRef = useRef(false);

  // 数据去重函数 - 基于ID去重
  const deduplicateItems = useCallback(
    (items: SidebarItem[]): SidebarItem[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.id)) {
          return false;
        }
        seen.add(item.id);
        return true;
      });
    },
    [],
  );

  // 加载指定页数据
  const loadPage = useCallback(
    async (
      page: number,
      isLoadMore: boolean = false,
    ): Promise<SidebarItem[]> => {
      // 防止重复请求
      if (isLoadingRef.current) {
        return [];
      }

      // 参数验证
      if (!userId || userId.trim() === '') {
        throw new SidebarAPIError('用户ID不能为空', 'INVALID_USER_ID');
      }

      isLoadingRef.current = true;

      try {
        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // 设置加载状态
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError(null);

        // 调用API获取数据
        const response = await fetchPaginatedSidebarData({
          page,
          pageSize,
          userId,
        });

        // 更新状态
        setTotal(response.total);
        setHasMore(response.hasMore);
        setCurrentPage(page);

        // 预加载下一页（性能优化）
        if (response.hasMore) {
          preloadNextPage({ page: page + 1, pageSize, userId });
        }

        return response.data;
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error instanceof SidebarAPIError
            ? `${error.message} (${getErrorRecoveryAction(error)})`
            : `加载失败: ${error.message}`;

        setError(errorMessage);
        console.error('分页数据加载错误:', error);

        return [];
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [userId, pageSize],
  );

  // 初始化数据加载
  const initializeData = useCallback(async () => {
    if (!userId) return;

    try {
      const firstPageData = await loadPage(initialPage, false);
      setData(firstPageData);
    } catch (error) {
      // 错误已经在 loadPage 中处理了
    }
  }, [userId, initialPage, loadPage]);

  // 加载更多数据
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoadingRef.current) {
      return;
    }

    try {
      const nextPage = currentPage + 1;
      const newData = await loadPage(nextPage, true);

      if (newData.length > 0) {
        setData((prevData) => {
          const combinedData = [...prevData, ...newData];
          return deduplicateItems(combinedData);
        });
      }
    } catch (error) {
      // 错误已经在 loadPage 中处理了
    }
  }, [hasMore, currentPage, loadPage, deduplicateItems]);

  // 刷新数据（下拉刷新）
  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      // 重置分页状态到第一页，但保留现有数据展示避免闪烁
      const resetPage = 1;
      setCurrentPage(resetPage);
      setHasMore(true);
      setError(null);
      // 注意：不清空 data，保持现有数据展示，避免闪烁

      // 调用API时明确传递重置后的页码
      const refreshedData = await refreshSidebarData(
        userId,
        pageSize,
        resetPage,
      );

      // 直接替换数据，而不是先清空再设置
      setData(refreshedData.data);
      setTotal(refreshedData.total);
      setHasMore(refreshedData.hasMore);
      // 不再重复设置 currentPage，保持一致性

      // 预加载下一页
      if (refreshedData.hasMore) {
        preloadNextPage({ page: resetPage + 1, pageSize, userId });
      }
    } catch (err) {
      const error = err as Error;
      const errorMessage = `刷新失败: ${error.message}`;
      setError(errorMessage);
      console.error('数据刷新错误:', error);
      // 失败时保留原有数据，让用户可以继续查看
    }
  }, [userId, pageSize]);

  // 重试函数
  const retry = useCallback(async (): Promise<void> => {
    if (data.length === 0) {
      // 如果没有数据，重新初始化
      await initializeData();
    } else {
      // 如果有数据，刷新数据
      await refresh();
    }
  }, [data.length, initializeData, refresh]);

  // 监听 userId 变化，重新初始化数据
  useEffect(() => {
    if (userId) {
      initializeData();
    } else {
      // 清空数据
      setData([]);
      setError(null);
      setHasMore(false);
      setTotal(0);
      setCurrentPage(initialPage);
    }

    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isLoadingRef.current = false;
    };
  }, [userId, initializeData, initialPage]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    isLoadingMore,
    // 额外的状态信息
    total,
    currentPage,
    retry,
    // 工具函数
    isEmpty: data.length === 0 && !loading,
    isInitialLoading: loading && data.length === 0,
  };
};
