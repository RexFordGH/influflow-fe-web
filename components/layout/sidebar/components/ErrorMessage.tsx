// Error message component - Friendly error prompts and retry functionality

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { ErrorMessageProps } from '../types/sidebar.types';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
}) => {
  const getErrorMessage = (error: Error): string => {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network connection failed, please check your network settings';
    }
    if (
      error.message.includes('permission') ||
      error.message.includes('auth')
    ) {
      return 'You do not have permission to access this content';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out, please try again later';
    }
    return 'Failed to load, please try again later';
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      {/* Error icon */}
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
        <ExclamationTriangleIcon className="size-6 text-red-500" />
      </div>

      {/* Error title */}
      <h3 className="mb-2 text-lg font-medium text-gray-900">Something went wrong</h3>

      {/* Error message */}
      <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
        {getErrorMessage(error)}
      </p>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Retry
      </button>

      {/* Detailed error information (development environment) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 w-full max-w-sm">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
            View detailed error information
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
};
