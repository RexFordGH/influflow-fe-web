import { useState } from 'react';

export function useSSELoading() {
  // 直接从环境变量读取初始值，避免在 useEffect 中修改导致重新渲染
  const [useSSE, setUseSSE] = useState<boolean>(() => {
    // 使用函数初始化，确保只在首次渲染时读取环境变量
    return process.env.NEXT_PUBLIC_USE_SSE_LOADING === 'true';
  });

  const toggleSSE = () => setUseSSE((v) => !v);

  return { useSSE, toggleSSE };
}
