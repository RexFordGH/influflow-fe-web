import { addToast } from '@/components/base/toast';
import { getErrorMessage, useGenerateThread } from '@/lib/api/services';
import { convertAPIDataToGeneratedContent } from '@/lib/data/converters';
import { ModeHandlerFactory } from '@/services/mode-handlers';
import { useAuthStore } from '@/stores/authStore';
import { IContentFormat, IMode } from '@/types/api';
import { GeneratedContent } from '@/types/content';
import { GenerationParams } from '@/types/generation';
import { IOutline } from '@/types/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGenerationOrchestrator } from './useGenerationOrchestrator';

interface UseGenerationStateProps {
  mode?: IMode;
  topic: string;
  contentFormat: IContentFormat;
  initialData?: IOutline;
  sessionId?: string;
  userInput?: string;
  onGenerationComplete?: (data: IOutline) => void;
  onGenerationError?: (error: Error) => void;
}

interface UseGenerationStateReturn {
  // 状态
  isGenerating: boolean;
  generationStep: number;
  generationSteps: string[];
  hasStartedGeneration: boolean;
  apiError: string | null;
  rawAPIData: IOutline | null;
  generatedContent: GeneratedContent | null;
  currentMode: IMode;

  // 方法
  startGeneration: (params?: GenerationParams) => void;
  resetGeneration: () => void;
  setRawAPIData: (data: IOutline) => void;
  setMode: (mode: IMode) => void;
  retryGeneration: () => void;
}

// 生成步骤配置
const GENERATION_STEPS = [
  'Analyzing topic content and related background',
  'Building mind map structure framework',
  'Generating structured article content',
  'Establishing relationships between content',
  'Refining details and optimizing layout',
];

// 步骤时间配置
const STEP_TIMINGS = [
  { step: 1, delay: 2000 },
  { step: 2, delay: 4000 },
  { step: 3, delay: 6500 },
];

export function useGenerationState({
  mode: initialMode,
  topic,
  contentFormat,
  initialData,
  sessionId,
  userInput,
  onGenerationComplete,
  onGenerationError,
}: UseGenerationStateProps): UseGenerationStateReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rawAPIData, setRawAPIData] = useState<IOutline | null>(
    initialData || null,
  );

  // 使用 ref 来追踪请求状态，避免严格模式下的重复执行
  const requestIdRef = useRef<string | null>(null);

  // 获取用户信息用于个性化设置
  const { user } = useAuthStore();

  // API调用hook
  const { mutate: generateThread } = useGenerateThread();

  // 使用生成流程编排器
  const {
    context,
    transitionToPhase,
    changeMode,
    startGeneration: orchestratorStart,
    resetGeneration: orchestratorReset,
    retryGeneration: orchestratorRetry,
  } = useGenerationOrchestrator();

  // 生成步骤数组
  const generationSteps = useMemo(() => GENERATION_STEPS, []);

  // 转换生成的内容
  const generatedContent = useMemo(() => {
    if (!rawAPIData) return null;
    return convertAPIDataToGeneratedContent(rawAPIData);
  }, [rawAPIData]);

  // 处理来自WelcomeScreen的模式参数
  useEffect(() => {
    if (initialMode && context.mode !== initialMode) {
      changeMode(initialMode);
    }
  }, [initialMode, context.mode, changeMode]);

  // 解析topic中的参考推文
  const parseTopicWithReferences = useCallback((topicInput: string) => {
    let userInput = topicInput.trim();
    let referenceUrls: string[] = [];

    const referenceMatch = userInput.match(
      /\.\s*Reference these popular posts:\s*(.+)$/,
    );
    if (referenceMatch) {
      userInput = userInput.replace(referenceMatch[0], '').trim();
      referenceUrls = referenceMatch[1].split(',').map((url) => url.trim());
    }

    if (referenceUrls.length > 0) {
      userInput = `${userInput}. Reference Tweets: ${referenceUrls.join(',')}`;
    }

    return { userInput, referenceUrls };
  }, []);

  // 构建请求数据 - 使用新的架构
  const buildGenerationRequest = useCallback(() => {
    try {
      const handler = ModeHandlerFactory.getHandler(context.mode);

      // 根据不同模式准备参数
      let params: any = {};

      if (context.mode === 'draft') {
        params = {
          sessionId: sessionId || context.sessionId,
          userInput: userInput || context.userInput,
        };
      } else {
        // lite 和 analysis 模式
        const { userInput: parsedInput } = parseTopicWithReferences(
          userInput || context.userInput || topic,
        );
        params = {
          userInput: parsedInput,
        };
      }

      const request = handler.buildRequest(topic, contentFormat, params);

      // 添加mode字段确保兼容性
      // 当content_format为deep_research时，mode置为'analysis',仅为后端校验，实质无用
      return {
        ...request,
        mode: context.contentFormat === 'deep_research' ? 'analysis' : context.mode,
      };
    } catch (error) {
      console.error('Failed to build generation request:', error);
      throw error;
    }
  }, [
    context,
    topic,
    contentFormat,
    sessionId,
    userInput,
    parseTopicWithReferences,
  ]);

  // 动画步骤推进
  const animateGenerationSteps = useCallback(
    (setStep: (step: number) => void, isCompleted: { current: boolean }) => {
      const stepTimeouts: NodeJS.Timeout[] = [];

      STEP_TIMINGS.forEach(({ step, delay }) => {
        const timeout = setTimeout(() => {
          if (!isCompleted.current) {
            setStep(step);
          }
        }, delay);
        stepTimeouts.push(timeout);
      });

      const waitingStepTimeout = setTimeout(() => {
        if (!isCompleted.current) {
          setStep(4);

          const finalStepTimeout = setTimeout(() => {
            if (!isCompleted.current) {
              setStep(5);
            }
          }, 4000);
          stepTimeouts.push(finalStepTimeout);
        }
      }, 8000);
      stepTimeouts.push(waitingStepTimeout);

      return () => {
        stepTimeouts.forEach((timeout) => clearTimeout(timeout));
      };
    },
    [],
  );

  // 开始生成 - 重构版本
  const startGeneration = useCallback(
    (params?: GenerationParams) => {
      // 如果提供了参数，使用orchestrator开始生成
      if (params) {
        orchestratorStart(params);
        // 当传入参数时，orchestratorStart会处理phase转换
        // 不需要继续执行下面的逻辑，避免重复调用
        return;
      }

      // 防止重复请求
      if (hasStartedGeneration || context.phase !== 'generating') return;

      const currentRequestId = `${topic}-${context.mode}-${Date.now()}`;

      if (requestIdRef.current === currentRequestId) return;

      console.log(
        '开始API生成，topic:',
        topic,
        'mode:',
        context.mode,
        'requestId:',
        currentRequestId,
      );
      requestIdRef.current = currentRequestId;
      setHasStartedGeneration(true);
      setApiError(null);
      setGenerationStep(0);
      setIsGenerating(true);

      const isAPICompleted = { current: false };

      // 启动智能UI进度动画
      const cleanup = animateGenerationSteps(setGenerationStep, isAPICompleted);

      try {
        // 准备请求数据
        const requestData = buildGenerationRequest();

        // 调用API
        generateThread(requestData, {
          onSuccess: (response) => {
            // 检查请求是否还是当前请求
            if (requestIdRef.current !== currentRequestId) {
              console.log('忽略过期的API响应');
              cleanup();
              return;
            }

            isAPICompleted.current = true;
            cleanup();
            console.log('API生成成功:', response);

            // 快速完成所有步骤
            const completeSteps = async () => {
              for (let i = 4; i < generationSteps.length; i++) {
                setGenerationStep(i);
                await new Promise((resolve) => setTimeout(resolve, 500));
              }

              setRawAPIData(response);
              setIsGenerating(false);
              setGenerationStep(generationSteps.length - 1);
              transitionToPhase('completed');
              onGenerationComplete?.(response);
            };

            completeSteps();
          },
          onError: (error) => {
            // 检查请求是否还是当前请求
            if (requestIdRef.current !== currentRequestId) {
              console.log('忽略过期的API错误');
              cleanup();
              return;
            }

            isAPICompleted.current = true;
            cleanup();
            console.error('API生成失败:', error);
            const errorMessage = getErrorMessage(error);

            setApiError(errorMessage);
            setIsGenerating(false);
            transitionToPhase('error');

            addToast({
              title: 'Failed to generate content',
              description: errorMessage,
              color: 'danger',
              timeout: 3000,
            });

            onGenerationError?.(error as Error);
          },
        });
      } catch (error) {
        // 处理构建请求时的错误
        cleanup();
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to build request';
        setApiError(errorMessage);
        setIsGenerating(false);
        transitionToPhase('error');

        addToast({
          title: 'Failed to start generation',
          description: errorMessage,
          color: 'danger',
          timeout: 3000,
        });
      }

      return cleanup;
    },
    [
      topic,
      hasStartedGeneration,
      context,
      generateThread,
      generationSteps.length,
      buildGenerationRequest,
      animateGenerationSteps,
      orchestratorStart,
      transitionToPhase,
      onGenerationComplete,
      onGenerationError,
    ],
  );

  // 重置生成状态
  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationStep(0);
    setHasStartedGeneration(false);
    setApiError(null);
    setRawAPIData(null);
    requestIdRef.current = null;
    orchestratorReset();
  }, [orchestratorReset]);

  // 当topic变化时重置状态
  useEffect(() => {
    if (topic && !initialData) {
      resetGeneration();
      setIsGenerating(true);
    }
  }, [topic, initialData, resetGeneration]);

  // 处理初始数据
  useEffect(() => {
    if (initialData) {
      setRawAPIData(initialData);
      setIsGenerating(false);
    }
  }, [initialData]);

  // 监听生成阶段变化，自动启动生成流程
  useEffect(() => {
    if (context.phase === 'generating' && !hasStartedGeneration) {
      startGeneration();
    }
  }, [context.phase, hasStartedGeneration, startGeneration]);

  return {
    // 状态
    isGenerating,
    generationStep,
    generationSteps,
    hasStartedGeneration,
    apiError,
    rawAPIData,
    generatedContent,
    currentMode: context.mode,

    // 方法
    startGeneration,
    resetGeneration,
    setRawAPIData,
    setMode: changeMode,
    retryGeneration: orchestratorRetry,
  };
}
