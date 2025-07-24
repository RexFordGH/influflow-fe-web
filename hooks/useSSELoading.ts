import { useState } from 'react';

// 默认使用原有的加载组件，可以通过环境变量或localStorage切换
const SSE_LOADING_KEY = 'use-sse-loading';

export function useSSELoading() {
  const [useSSE, setUseSSE] = useState(true);

  const toggleSSE = () => {
    const newValue = !useSSE;
    setUseSSE(newValue);
    localStorage.setItem(SSE_LOADING_KEY, newValue.toString());
  };

  return { useSSE, toggleSSE };
}
