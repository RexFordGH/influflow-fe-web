import { useEffect } from 'react';

// 性能监控 Hook
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('scroll')) {
          if (entry.duration > 16) {
            // 超过16ms (60fps)
            console.warn('Scroll performance issue detected:', {
              name: entry.name,
              duration: entry.duration,
              timestamp: entry.startTime,
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['measure'] });
    } catch (e) {
      console.log('Performance monitoring not supported');
    }

    return () => observer.disconnect();
  }, []);
};

// 浏览器兼容性检测
export const useBrowserCompatibility = () => {
  const features = {
    smoothScroll:
      typeof window !== 'undefined' &&
      'scrollBehavior' in document.documentElement.style,
    intersectionObserver:
      typeof window !== 'undefined' && 'IntersectionObserver' in window,
    performanceObserver:
      typeof window !== 'undefined' && 'PerformanceObserver' in window,
  };

  useEffect(() => {
    if (!features.smoothScroll) {
      console.warn('Smooth scrolling not supported, using fallback');
    }
  }, [features.smoothScroll]);

  return features;
};
