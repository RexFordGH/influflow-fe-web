'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChatDraftConfirmation } from '@/components/draft/ChatDraftConfirmation';
import { ArticleRenderer } from '@/components/Renderer/ArticleRenderer';
import { GenerationModeManager } from '@/services/GenerationModeManager';
import { IContentFormat, IMode } from '@/types/api';
import { GenerationOrchestratorProps } from '@/types/generation';
import { IOutline } from '@/types/outline';

// 生成流程编排器组件
export function GenerationOrchestrator({
  mode,
  topic,
  contentFormat,
  userInput,
  sessionId,
  onComplete,
  onError,
  onBack,
}: GenerationOrchestratorProps) {
  const [currentPhase, setCurrentPhase] = useState<'draft' | 'generation'>(
    'draft',
  );
  const [draftSessionId, setDraftSessionId] = useState<string | undefined>(
    sessionId,
  );

  const modeManager = useMemo(() => GenerationModeManager.getInstance(), []);
  const modeConfig = useMemo(
    () => modeManager.getModeConfig(mode),
    [mode, modeManager],
  );

  // 草案确认完成处理
  const handleDraftConfirmed = useCallback(
    (
      _topic: string,
      _format: IContentFormat,
      _mode?: IMode,
      sessionId?: string,
    ) => {
      setDraftSessionId(sessionId);
      setCurrentPhase('generation');
    },
    [],
  );

  // 直接跳到生成阶段
  useEffect(() => {
    if (!modeConfig.requiresDraftConfirmation) {
      setCurrentPhase('generation');
    }
  }, [modeConfig.requiresDraftConfirmation]);

  // 处理生成完成
  const handleGenerationComplete = useCallback(
    (data: IOutline) => {
      onComplete(data);
    },
    [onComplete],
  );

  // 处理生成错误
  const handleGenerationError = useCallback(
    (error: Error) => {
      onError(error);
    },
    [onError],
  );

  // 渲染草案确认阶段
  if (currentPhase === 'draft' && modeConfig.requiresDraftConfirmation) {
    return (
      <ChatDraftConfirmation
        topic={topic}
        contentFormat={contentFormat}
        mode={mode}
        onBack={onBack}
        onConfirm={handleDraftConfirmed}
      />
    );
  }

  // 渲染生成阶段
  return (
    <ArticleRenderer
      topic={topic}
      contentFormat={contentFormat}
      mode={mode}
      userInput={userInput}
      sessionId={draftSessionId}
      onBack={onBack}
      onGenerationComplete={handleGenerationComplete}
      onGenerationError={handleGenerationError}
    />
  );
}
