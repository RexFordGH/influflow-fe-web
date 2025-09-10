// AppSidebar 轻量化改造 - 类型定义

import { IContentFormat, IMode } from '@/types/api';

// 分页参数接口
export interface PaginationParams {
  page: number; // 当前页码（从1开始）
  pageSize: number; // 每页数据量（默认20）
  userId: string; // 用户ID
}

// 分页响应接口
export interface PaginationResponse<T> {
  data: T[]; // 当前页数据
  total: number; // 总数据量
  page: number; // 当前页码
  pageSize: number; // 每页数据量
  hasMore: boolean; // 是否还有更多数据
}

export interface IArticleData {
  id: string;
  topic: string;
  content_format: IContentFormat;
  tweets: any[];
  updated_at: string;
  created_at: string;
  mode: IMode;
  search_enabled: boolean;
}

// 侧边栏列表项接口
export interface SidebarItem {
  id: string;
  title: string;
  type: 'category' | 'tweet';
  createdAt: string;
  updatedAt?: string;
  // 完整的tweet数据（用于渲染器）
  tweetData?: IArticleData;
}

// 简化后的 AppSidebar 组件 Props
export interface AppSidebarProps {
  onItemClick?: (item: SidebarItem) => void;
  selectedId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// AppSidebar 组件状态
export interface AppSidebarState {
  items: SidebarItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

// SidebarItem 组件 Props
export interface SidebarItemProps {
  item: SidebarItem;
  onClick: (item: SidebarItem) => void;
  isSelected?: boolean;
}

// 分页数据 Hook 选项
export interface UsePaginatedDataOptions {
  userId: string;
  pageSize?: number;
  initialPage?: number;
}

// 分页数据 Hook 返回值
export interface UsePaginatedDataReturn {
  data: SidebarItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoadingMore: boolean;
  total: number;
  currentPage: number;
  retry: () => Promise<void>;
  isEmpty: boolean;
  isInitialLoading: boolean;
}

// 无限滚动 Hook 选项
export interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number; // 距离底部多少像素时触发，默认100
  loading?: boolean;
}

// 加载状态枚举
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADING_MORE = 'loading_more',
  SUCCESS = 'success',
  ERROR = 'error',
}

// 加载状态管理器接口
export interface LoadingStateManager {
  state: LoadingState;
  error: string | null;
  retry: () => void;
}

// 状态管理相关类型
export interface SidebarState {
  items: Map<string, SidebarItem>; // 使用 Map 提高查找效率
  itemIds: string[]; // 保持顺序的 ID 列表
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// Action 类型定义
export type SidebarAction =
  | { type: 'FETCH_START' }
  | {
      type: 'FETCH_SUCCESS';
      payload: { items: SidebarItem[]; hasMore: boolean; total: number };
    }
  | { type: 'FETCH_ERROR'; payload: string }
  | {
      type: 'APPEND_ITEMS';
      payload: { items: SidebarItem[]; hasMore: boolean };
    }
  | { type: 'RESET' };

// 错误处理组件 Props
export interface ErrorMessageProps {
  error: Error;
  onRetry: () => void;
}

// 虚拟滚动选项（可选实现）
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: SidebarItem[];
  overscan?: number; // 额外渲染的项目数
}
