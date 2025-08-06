import { GenerationModeManager } from '@/services/GenerationModeManager';
import { IMode } from '@/types/api';
import {
  GenerationContext,
  GenerationParams,
  GenerationPhase,
} from '@/types/generation';
import { useCallback, useMemo, useState } from 'react';

// 阶段转换逻辑
const phaseTransitions: Record<GenerationPhase, GenerationPhase[]> = {
  init: ['mode_select'],
  mode_select: ['draft_confirm', 'generating'],
  draft_confirm: ['generating', 'mode_select'],
  generating: ['completed', 'error'],
  completed: ['init'],
  error: ['init', 'generating'],
};

// 创建初始上下文
function createInitialContext(mode?: IMode): GenerationContext {
  return {
    mode: mode || 'analysis',
    phase: 'init',
    topic: '',
    contentFormat: 'longform',
    userInput: undefined,
    sessionId: undefined,
    retryCount: 0,
    startTime: Date.now(),
  };
}

export function useGenerationOrchestrator() {
  const [context, setContext] = useState<GenerationContext>(() =>
    createInitialContext(),
  );

  const modeManager = useMemo(() => GenerationModeManager.getInstance(), []);

  // 阶段转换
  const transitionToPhase = useCallback(
    (newPhase: GenerationPhase) => {
      const currentPhase = context.phase;
      const allowedTransitions = phaseTransitions[currentPhase] || [];

      if (allowedTransitions.includes(newPhase)) {
        setContext((prev) => ({ ...prev, phase: newPhase }));
      } else {
        console.warn(
          `Invalid phase transition: ${currentPhase} -> ${newPhase}`,
        );
      }
    },
    [context.phase],
  );

  // 模式切换
  const changeMode = useCallback(
    (mode: IMode) => {
      if (modeManager.isValidMode(mode)) {
        setContext((prev) => ({ ...prev, mode }));
      }
    },
    [modeManager],
  );

  // 开始生成
  const startGeneration = useCallback((params: GenerationParams) => {
    const { topic, contentFormat, userInput, sessionId, mode } = params;

    setContext((prev) => ({
      ...prev,
      topic,
      contentFormat,
      userInput,
      sessionId,
      mode: mode || prev.mode,
      phase: 'generating',
      startTime: Date.now(),
      retryCount: 0,
    }));
  }, []);

  // 重置状态
  const resetGeneration = useCallback(() => {
    setContext(createInitialContext(context.mode));
  }, [context.mode]);

  // 重试生成
  const retryGeneration = useCallback(() => {
    setContext((prev) => ({
      ...prev,
      phase: 'generating',
      retryCount: prev.retryCount + 1,
      startTime: Date.now(),
    }));
  }, []);

  return {
    context,
    transitionToPhase,
    changeMode,
    startGeneration,
    resetGeneration,
    retryGeneration,
  };
}
