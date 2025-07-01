'use client';

import {
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardBody, Progress, Spinner } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import { useGenerateThread, getErrorMessage } from '@/lib/api/services';
import { 
  convertAPIDataToGeneratedContent, 
  convertAPIDataToMarkdown,
  convertTweetsToMarkdown,
  convertMindmapToTweets 
} from '@/lib/data/converters';

import EditableContentMindmap from './EditableContentMindmap';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';

interface EnhancedContentGenerationProps {
  topic: string;
  onBack: () => void;
}

// 基于思维导图节点生成Markdown内容 - 使用新的Twitter Thread格式
const generateMarkdownFromNodes = (
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
  topic: string,
): string => {
  // 使用转换器将思维导图数据转换回tweets和outline
  const { tweets, outline } = convertMindmapToTweets(nodes, edges);
  
  // 使用标准的tweets转markdown函数
  return convertTweetsToMarkdown(tweets, topic, outline);
};


export function EnhancedContentGeneration({
  topic,
  onBack,
}: EnhancedContentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [generationStep, setGenerationStep] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentNodes, setCurrentNodes] = useState<MindmapNodeData[]>([]);
  const [currentEdges, setCurrentEdges] = useState<MindmapEdgeData[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false); // 防止重复请求
  const [rawAPIData, setRawAPIData] = useState<any>(null); // 存储原始API数据
  const [hoveredTweetId, setHoveredTweetId] = useState<string | null>(null); // hover状态
  
  // 使用 ref 来追踪请求状态，避免严格模式下的重复执行
  const requestIdRef = useRef<string | null>(null);

  // API调用hook
  const { mutate: generateThread, isPending: isGeneratingAPI } = useGenerateThread();

  // 生成思维过程步骤
  const generationSteps = [
    '🔍 分析主题内容和相关背景...',
    '🧠 构建思维导图结构框架...',
    '📝 生成结构化文章内容...',
    '🎨 创建主题相关配图...',
    '🔗 建立内容间关联关系...',
    '✨ 完善细节和优化排版...',
  ];

  // AI生成过程 - 使用真实API
  useEffect(() => {
    // 防止重复请求：如果已经开始生成或者不在生成状态，直接返回
    if (!isGenerating || hasStartedGeneration) return;

    // 生成唯一的请求ID
    const currentRequestId = `${topic}-${Date.now()}`;
    
    // 如果当前请求ID与ref中的相同，说明是重复执行，直接返回
    if (requestIdRef.current === currentRequestId) return;
    
    console.log('开始API生成，topic:', topic, 'requestId:', currentRequestId);
    requestIdRef.current = currentRequestId;
    setHasStartedGeneration(true);
    setApiError(null);
    setGenerationStep(0);

    // 启动UI进度动画
    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < generationSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    // 调用API
    generateThread({ topic: topic.trim() }, {
      onSuccess: (response) => {
        // 检查请求是否还是当前请求（避免竞态条件）
        if (requestIdRef.current !== currentRequestId) {
          console.log('忽略过期的API响应');
          clearInterval(interval);
          return;
        }
        
        clearInterval(interval);
        console.log('API生成成功:', response);
        
        // 存储原始API数据
        setRawAPIData(response);
        
        // 转换API数据为组件所需格式
        const content = convertAPIDataToGeneratedContent(response);
        setGeneratedContent(content);
        setCurrentNodes(content.mindmap.nodes);
        setCurrentEdges(content.mindmap.edges);
        setIsGenerating(false);
        setGenerationStep(generationSteps.length - 1);
      },
      onError: (error) => {
        // 检查请求是否还是当前请求
        if (requestIdRef.current !== currentRequestId) {
          console.log('忽略过期的API错误');
          clearInterval(interval);
          return;
        }
        
        clearInterval(interval);
        console.error('API生成失败:', error);
        const errorMessage = getErrorMessage(error);
        setApiError(errorMessage);
        setIsGenerating(false);
        setHasStartedGeneration(false); // 失败时重置，允许重试
        requestIdRef.current = null; // 清除请求ID
      },
    });

    return () => {
      clearInterval(interval);
    };
  }, [topic, isGenerating, hasStartedGeneration]); // 添加 hasStartedGeneration 依赖

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);

      // 根据选中的节点高亮对应的推文
      if (nodeId && currentNodes) {
        const node = currentNodes.find((n) => n.id === nodeId);
        if (node && node.data?.tweetId) {
          setHoveredTweetId(node.data.tweetId.toString());
        } else {
          setHoveredTweetId(null);
        }
      } else {
        setHoveredTweetId(null);
      }
    },
    [currentNodes],
  );

  // 处理思维导图节点的 hover 事件
  const handleNodeHover = useCallback(
    (tweetId: string | null) => {
      console.log('EnhancedContentGeneration handleNodeHover called with:', tweetId);
      setHoveredTweetId(tweetId);
    },
    [],
  );

  // 处理 markdown 区域的 hover 事件（从 markdown 到思维导图的反向联动）
  const handleMarkdownHover = useCallback((tweetId: string | null) => {
    setHoveredTweetId(tweetId);
  }, []);

  const handleSourceClick = useCallback((sectionId: string) => {
    // 显示信息来源弹窗或侧边栏
    console.log('显示信息来源:', sectionId);
    // TODO: 实现信息来源展示功能
  }, []);

  // 处理思维导图节点变化
  const handleNodesChange = useCallback((newNodes: MindmapNodeData[]) => {
    setCurrentNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: MindmapEdgeData[]) => {
    setCurrentEdges(newEdges);
  }, []);

  // 基于思维导图重新生成内容
  const regenerateFromMindmap = useCallback(async () => {
    if (!generatedContent) return;

    setIsRegenerating(true);

    // 基于当前思维导图重新生成内容
    setTimeout(() => {
      const newMarkdown = generateMarkdownFromNodes(currentNodes, currentEdges, topic);
      
      // 重新转换思维导图数据为tweets和outline
      const { tweets, outline } = convertMindmapToTweets(currentNodes, currentEdges);

      setGeneratedContent({
        ...generatedContent,
        mindmap: {
          nodes: currentNodes,
          edges: currentEdges,
        },
        tweets,
        outline,
        metadata: {
          ...generatedContent.metadata,
          totalTweets: tweets.length,
          estimatedReadTime: Math.ceil(tweets.reduce((acc, tweet) => acc + tweet.content.length, 0) / 200),
        },
      });

      setIsRegenerating(false);
    }, 2000);
  }, [currentNodes, currentEdges, generatedContent, topic]);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    setIsGenerating(true);
    setGeneratedContent(null);
    setGenerationStep(0);
    setSelectedNodeId(null);
    setHighlightedSection(null);
    setHasStartedGeneration(false); // 重置请求状态，允许重新请求
    requestIdRef.current = null; // 清除请求ID

    // 模拟重新生成过程
    setTimeout(() => {
      setIsRegenerating(false);
    }, 2000);
  }, []);

  // 加载状态和错误状态
  if (isGenerating || (!generatedContent && apiError)) {
    const hasError = !isGenerating && apiError;
    
    return (
      <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* 顶部栏 */}
        <div className="border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                isIconOnly
                variant="light"
                onPress={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeftIcon className="size-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {hasError ? '生成失败' : isRegenerating ? '重新生成中...' : 'AI 正在思考和创作'}
              </h1>
            </div>
          </div>
        </div>

        {/* 生成进度或错误信息 */}
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardBody className="p-8">
              <div className="text-center">
                {hasError ? (
                  /* 错误状态 */
                  <>
                    <div className="mb-8">
                      <div className="relative mx-auto mb-4 size-16">
                        <div className="absolute inset-0 rounded-full bg-red-100"></div>
                        <div className="flex size-full items-center justify-center">
                          <svg className="size-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-red-600">
                      生成失败
                    </h2>

                    <p className="mb-2 text-gray-600">
                      主题:{' '}
                      <span className="font-medium text-blue-600">{topic}</span>
                    </p>

                    <p className="mb-8 text-sm text-red-500">
                      {apiError}
                    </p>

                    <div className="flex justify-center gap-3">
                      <Button
                        color="primary"
                        onPress={() => {
                          setApiError(null);
                          setHasStartedGeneration(false);
                          requestIdRef.current = null;
                          setIsGenerating(true);
                        }}
                        className="px-8"
                      >
                        重试
                      </Button>
                      <Button
                        variant="light"
                        onPress={onBack}
                        className="px-8"
                      >
                        返回
                      </Button>
                    </div>
                  </>
                ) : (
                  /* 加载状态 */
                  <>
                    <div className="mb-8">
                      <Spinner size="lg" color="primary" className="mb-4" />
                      <div className="relative mx-auto mb-4 size-16">
                        <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100"></div>
                        <div className="absolute inset-2 animate-ping rounded-full bg-blue-200"></div>
                      </div>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                      AI 正在为您创作内容
                    </h2>

                    <p className="mb-2 text-gray-600">
                      主题:{' '}
                      <span className="font-medium text-blue-600">{topic}</span>
                    </p>

                    <p className="mb-8 text-sm text-gray-500">
                      正在运用先进的AI技术为您生成思维导图和深度内容
                    </p>

                    <div className="space-y-6">
                      <Progress
                        value={
                          ((generationStep + 1) / generationSteps.length) * 100
                        }
                        color="primary"
                        size="md"
                        className="mb-6"
                      />

                      <div className="space-y-3">
                        {generationSteps.map((step, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-3 rounded-lg p-3 transition-all duration-300 ${
                              index <= generationStep
                                ? 'border border-blue-200 bg-blue-50 text-blue-600'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            <div
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                                index <= generationStep
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-300'
                              }`}
                            >
                              {index < generationStep ? (
                                <svg
                                  className="size-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : index === generationStep ? (
                                <div className="size-2 animate-pulse rounded-full bg-current" />
                              ) : (
                                <span className="text-xs font-medium">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {generatedContent?.topic}
              </h1>
              <p className="text-sm text-gray-500">
                共 {generatedContent?.metadata.totalTweets} 条推文 · 预计阅读{' '}
                {generatedContent?.metadata.estimatedReadTime} 分钟
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<ArrowPathIcon className="size-4" />}
              onPress={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? '生成中...' : '重新生成'}
            </Button>
            <Button
              color="success"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              导出内容
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧思维导图 */}
        <div className="relative w-1/2 border-r border-gray-200 bg-white">
          <ReactFlowProvider>
            <EditableContentMindmap
              nodes={currentNodes}
              edges={currentEdges}
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onRegenerate={regenerateFromMindmap}
              highlightedNodeId={selectedNodeId}
              hoveredTweetId={hoveredTweetId}
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex w-1/2 flex-col bg-white">
          {/* Twitter Thread内容区域 */}
          <div className="flex-1 overflow-hidden">
            {rawAPIData && (
              <EnhancedMarkdownRenderer
                content={convertAPIDataToMarkdown(rawAPIData)}
                onSectionHover={handleMarkdownHover}
                onSourceClick={handleSourceClick}
                highlightedSection={hoveredTweetId}
                sources={generatedContent?.metadata.sources}
                hoveredTweetId={hoveredTweetId}
                imageData={generatedContent?.image}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
