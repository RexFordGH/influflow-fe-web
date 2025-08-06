import { useCallback, useEffect, useRef } from 'react';

// 使用 RAF 优化滚动事件处理
export const useOptimizedScrollHandler = () => {
  const rafId = useRef<number | undefined>(undefined);

  const handleScroll = useCallback((handler: () => void) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      handler();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return handleScroll;
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): T => {
  let lastCall = 0;
  return ((...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};
