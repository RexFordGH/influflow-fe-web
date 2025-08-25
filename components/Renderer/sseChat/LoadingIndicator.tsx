'use client';

import { cn } from '@heroui/react';

interface LoadingIndicatorProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3 border',
    md: 'h-4 w-4 border-2',
    lg: 'h-6 w-6 border-2',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-gray-300 border-t-gray-600',
          sizeClasses[size],
        )}
      />
      {text && (
        <span className={cn('text-gray-500', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
};

// Skeleton loader for messages
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="mb-4 animate-pulse">
      <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-3 w-4/6 rounded bg-gray-100" />
      </div>
    </div>
  );
};