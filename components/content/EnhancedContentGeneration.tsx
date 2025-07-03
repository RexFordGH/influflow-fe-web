'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import { getErrorMessage, useGenerateThread, useModifyOutline } from '@/lib/api/services';
import {
  convertAPIDataToGeneratedContent,
  convertAPIDataToMarkdown,
  convertMindmapToMarkdown,
  convertMindmapToTweets,
  convertThreadDataToMindmap,
} from '@/lib/data/converters';
import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import { Outline } from '@/types/outline';

import { ContentGenerationLoading } from './ContentGenerationLoading';
import EditableContentMindmap from './EditableContentMindmap';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';

interface EnhancedContentGenerationProps {
  topic: string;
  onBack: () => void;
}

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
  const [rawAPIData, setRawAPIData] = useState<Outline | null>(null); // 存储原始API数据
  const [hoveredTweetId, setHoveredTweetId] = useState<string | null>(null); // hover状态
  const [regeneratedMarkdown, setRegeneratedMarkdown] = useState<string | null>(
    null,
  ); // 重新生成的markdown
  const [loadingTweetId, setLoadingTweetId] = useState<string | null>(null); // markdown loading状态

  // 使用 ref 来追踪请求状态，避免严格模式下的重复执行
  const requestIdRef = useRef<string | null>(null);

  // API调用hook
  const { mutate: generateThread, isPending: isGeneratingAPI } =
    useGenerateThread();
  const modifyOutlineMutation = useModifyOutline();

  // 生成思维过程步骤
  const generationSteps = [
    'Analyzing topic content and related background',
    'Building mind map structure framework',
    'Generating structured article content',
    'Creating topic-related illustrations',
    'Establishing relationships between content',
    'Refining details and optimizing layout',
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
      setGenerationStep((prev) => {
        if (prev < generationSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    // 调用API
    generateThread(
      { user_input: topic.trim() },
      {
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
      },
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    topic,
    isGenerating,
    hasStartedGeneration,
    generateThread,
    generationSteps.length,
  ]);

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
  const handleNodeHover = useCallback((tweetId: string | null) => {
    console.log(
      'EnhancedContentGeneration handleNodeHover called with:',
      tweetId,
    );
    setHoveredTweetId(tweetId);
  }, []);

  // 处理 markdown 区域的 hover 事件（从 markdown 到思维导图的反向联动）
  const handleMarkdownHover = useCallback((tweetId: string | null) => {
    setHoveredTweetId(tweetId);
  }, []);

  // 处理 loading 状态变化
  const handleLoadingStateChange = useCallback((tweetId: string | null) => {
    setLoadingTweetId(tweetId);
  }, []);

  // 处理 Regenerate 按钮点击 - 调用 modify-outline API
  const handleRegenerateClick = useCallback(async () => {
    console.log('🔄 Regenerate 按钮被点击了！');
    console.log('rawAPIData:', rawAPIData);
    console.log('currentNodes:', currentNodes);
    
    if (!rawAPIData) {
      console.error('缺少原始数据，无法重新生成');
      alert('缺少原始数据，无法重新生成');
      return;
    }

    console.log('开始设置 loading 状态...');
    setIsRegenerating(true);

    try {
      // 从当前思维导图状态构建新的 outline 结构
      const currentOutlineFromMindmap = {
        topic: rawAPIData.topic,
        nodes: rawAPIData.nodes, // 使用原始结构，但会被思维导图的更改覆盖
        total_tweets: rawAPIData.total_tweets,
      };

      // 构建包含用户编辑的新 outline 结构
      // 这里需要从当前的思维导图节点中提取修改后的数据
      const newOutlineStructure = { ...currentOutlineFromMindmap };
      
      // 更新主题（如果主题节点被编辑了）
      const topicNode = currentNodes.find(n => n.type === 'topic');
      if (topicNode) {
        newOutlineStructure.topic = topicNode.label;
      }

      // 更新大纲点和tweets
      const outlineNodes = currentNodes.filter(n => n.type === 'outline_point');
      const tweetNodes = currentNodes.filter(n => n.type === 'tweet');

      // 重新构建 nodes 数组
      newOutlineStructure.nodes = outlineNodes.map((outlineNode) => {
        const outlineIndex = outlineNode.data?.outlineIndex;
        const originalNode = rawAPIData.nodes[outlineIndex] || { tweets: [] };
        
        // 找到属于这个 outline 的所有 tweets
        const relatedTweets = tweetNodes
          .filter(t => t.data?.groupIndex === outlineIndex)
          .map(tweetNode => {
            const originalTweet = originalNode.tweets.find(
              t => t.tweet_number === tweetNode.data?.tweetId
            ) || {};
            
            return {
              ...originalTweet,
              title: tweetNode.label, // 使用编辑后的标题
              tweet_number: tweetNode.data?.tweetId || 0,
            };
          });

        return {
          ...originalNode,
          title: outlineNode.label, // 使用编辑后的标题
          tweets: relatedTweets,
        };
      });

      console.log('调用 modify-outline API with:', {
        original_outline: rawAPIData,
        new_outline_structure: newOutlineStructure,
      });

      // 调用 modify-outline API
      const result = await modifyOutlineMutation.mutateAsync({
        original_outline: rawAPIData,
        new_outline_structure: newOutlineStructure,
      });

      if (result.updated_outline) {
        console.log('Regenerate 成功，返回的数据:', result);

        const newOutline = result.updated_outline;

        // 更新所有状态
        setRawAPIData(newOutline);

        // 重新构建思维导图
        const { nodes: newNodes, edges: newEdges } = convertThreadDataToMindmap(newOutline);
        setCurrentNodes(newNodes);
        setCurrentEdges(newEdges);

        // 重新生成 markdown
        const newMarkdown = convertAPIDataToMarkdown(newOutline);
        setRegeneratedMarkdown(newMarkdown);

        // 更新生成的内容
        if (generatedContent) {
          const updatedContent = convertAPIDataToGeneratedContent(newOutline);
          setGeneratedContent({
            ...generatedContent,
            ...updatedContent,
          });
        }
      }
    } catch (error) {
      console.error('Regenerate 失败:', error);
      alert(`重新生成失败: ${getErrorMessage(error)}`);
    } finally {
      setIsRegenerating(false);
    }
  }, [rawAPIData, currentNodes, currentEdges, modifyOutlineMutation, generatedContent]);

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

  // 基于思维导图本地更新内容（不调用API）
  const regenerateFromMindmap = useCallback(
    (newMarkdown?: string) => {
      console.log(
        'Local regenerating from mindmap with markdown:',
        newMarkdown ? 'provided' : 'generated',
      );

      // 本地更新markdown显示
      const finalMarkdown =
        newMarkdown || convertMindmapToMarkdown(currentNodes, currentEdges);

      // 保存新的markdown供EnhancedMarkdownRenderer使用
      setRegeneratedMarkdown(finalMarkdown);
    },
    [currentNodes, currentEdges],
  );

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

  // 调试状态
  console.log('Render 条件检查:', {
    isGenerating,
    generatedContent: !!generatedContent,
    apiError,
    shouldShowLoading: isGenerating || (!generatedContent && apiError)
  });

  if (isGenerating || (!generatedContent && !rawAPIData)) {
    const hasError = !isGenerating && !!apiError;

    return (
      <ContentGenerationLoading
        topic={topic}
        onBack={onBack}
        isError={hasError}
        errorMessage={apiError || undefined}
        isRegenerating={isRegenerating}
        generationStep={generationStep}
        generationSteps={generationSteps}
        onRetry={
          hasError
            ? () => {
                setApiError(null);
                setHasStartedGeneration(false);
                requestIdRef.current = null;
                setIsGenerating(true);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-[4px]">
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
              originalOutline={rawAPIData || undefined} // 传入原始outline数据
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onRegenerate={regenerateFromMindmap}
              onRegenerateClick={handleRegenerateClick} // 传入 API 重生成回调
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
                content={
                  regeneratedMarkdown || convertAPIDataToMarkdown(rawAPIData)
                }
                onSectionHover={handleMarkdownHover}
                onSourceClick={handleSourceClick}
                highlightedSection={hoveredTweetId}
                sources={generatedContent?.metadata.sources}
                hoveredTweetId={hoveredTweetId}
                imageData={generatedContent?.image}
                loadingTweetId={loadingTweetId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
