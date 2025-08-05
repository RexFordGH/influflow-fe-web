import { IMode } from '@/types/api';
import { GenerationModeConfig } from '@/types/generation';

// 生成模式静态配置
export const GENERATION_MODES: Record<IMode, GenerationModeConfig> = {
  draft: {
    mode: 'draft',
    requiresDraftConfirmation: true,
    requiresSessionId: true,
    requiresUserInput: false,
    displayName: 'Chatbot Mode',
    description: '先生成内容草案，用户确认后生成最终内容',
    timeout: 120000,
  },
  lite: {
    mode: 'lite',
    requiresDraftConfirmation: false,
    requiresSessionId: false,
    requiresUserInput: true,
    displayName: 'Lite Mode',
    description: '直接根据用户输入快速生成内容',
    timeout: 90000,
  },
  analysis: {
    mode: 'analysis',
    requiresDraftConfirmation: false,
    requiresSessionId: false,
    requiresUserInput: true,
    displayName: 'Analysis Mode',
    description: '生成深度分析内容',
    timeout: 150000,
  },
};

// 默认生成配置
export const DEFAULT_GENERATION_CONFIG = {
  defaultMode: 'analysis' as IMode,
  enableModeSwitch: true,
  availableModes: ['lite', 'analysis', 'draft'] as IMode[],
  showModeDescription: true,
  enableRetry: true,
  maxRetries: 3,
  timeout: 120000,
};

// 获取所有可用模式
export const getAvailableModes = (): IMode[] => {
  return Object.keys(GENERATION_MODES) as IMode[];
};

// 获取模式配置
export const getModeConfig = (mode: IMode): GenerationModeConfig => {
  return GENERATION_MODES[mode];
};

// 验证模式是否有效
export const isValidMode = (mode: string): mode is IMode => {
  return Object.keys(GENERATION_MODES).includes(mode);
};
