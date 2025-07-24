'use client';

import { Button, Switch } from '@heroui/react';
import { useSSELoading } from '@/hooks/useSSELoading';

export function SSETestPage() {
  const { useSSE, toggleSSE } = useSSELoading();

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">SSE Loading</span>
        <Switch
          isSelected={useSSE}
          onValueChange={toggleSSE}
          size="sm"
          color="primary"
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        当前使用: {useSSE ? 'SSE流式加载' : '原始加载动画'}
      </p>
    </div>
  );
}