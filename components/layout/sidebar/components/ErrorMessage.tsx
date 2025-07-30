// 错误消息组件 - 友好的错误提示和重试功能

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { ErrorMessageProps } from '../types/sidebar.types';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
}) => {
  const getErrorMessage = (error: Error): string => {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return '网络连接失败，请检查您的网络设置';
    }
    if (
      error.message.includes('permission') ||
      error.message.includes('auth')
    ) {
      return '您没有权限访问此内容';
    }
    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    return '加载失败，请稍后重试';
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      {/* 错误图标 */}
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
        <ExclamationTriangleIcon className="size-6 text-red-500" />
      </div>

      {/* 错误标题 */}
      <h3 className="mb-2 text-lg font-medium text-gray-900">出现了一些问题</h3>

      {/* 错误消息 */}
      <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
        {getErrorMessage(error)}
      </p>

      {/* 重试按钮 */}
      <button
        onClick={onRetry}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        重试
      </button>

      {/* 详细错误信息（开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 w-full max-w-sm">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
            查看详细错误信息
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
};
