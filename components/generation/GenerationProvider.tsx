'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { DEFAULT_GENERATION_CONFIG } from '@/config/generation-modes';
import { IMode } from '@/types/api';
import { GenerationConfig } from '@/types/generation';

// Context类型定义
interface GenerationContextValue {
  currentMode: IMode;
  setCurrentMode: (mode: IMode) => void;
  config: GenerationConfig;
  updateConfig: (updates: Partial<GenerationConfig>) => void;
}

// 创建Context
const GenerationContext = createContext<GenerationContextValue | undefined>(
  undefined,
);

// Provider Props
interface GenerationProviderProps {
  children: ReactNode;
  initialMode?: IMode;
  config?: Partial<GenerationConfig>;
}

// Provider组件
export function GenerationProvider({
  children,
  initialMode,
  config: initialConfig,
}: GenerationProviderProps) {
  // 状态管理
  const [currentMode, setCurrentMode] = useState<IMode>(
    initialMode || DEFAULT_GENERATION_CONFIG.defaultMode,
  );

  const [config, setConfig] = useState<GenerationConfig>(() => ({
    ...DEFAULT_GENERATION_CONFIG,
    ...initialConfig,
  }));

  // 更新配置
  const updateConfig = (updates: Partial<GenerationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Context值
  const contextValue = useMemo(
    () => ({
      currentMode,
      setCurrentMode,
      config,
      updateConfig,
    }),
    [currentMode, config],
  );

  return (
    <GenerationContext.Provider value={contextValue}>
      {children}
    </GenerationContext.Provider>
  );
}

// 自定义Hook
export function useGenerationContext() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error(
      'useGenerationContext must be used within GenerationProvider',
    );
  }
  return context;
}
