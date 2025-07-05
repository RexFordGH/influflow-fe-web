'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import {
  getErrorMessage,
  useGenerateThread,
  useModifyOutline,
  useGenerateImage,
} from '@/lib/api/services';
import {
  convertAPIDataToGeneratedContent,
  convertAPIDataToMarkdown,
  convertMindmapToMarkdown,
  convertThreadDataToMindmap,
} from '@/lib/data/converters';
import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import { Outline, TweetContentItem } from '@/types/outline';

import { ContentGenerationLoading } from './ContentGenerationLoading';
import EditableContentMindmap from './EditableContentMindmap';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';
import { ImageEditModal } from './ImageEditModal';

interface EnhancedContentGenerationProps {
  topic: string;
  onBack: () => void;
}

export function EnhancedContentGeneration({
  topic,
  onBack,
}: EnhancedContentGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<{
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  } | null>(null);
  const [editingTweetData, setEditingTweetData] = useState<any | null>(null); // 新增：正在编辑的tweet 数据
  
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
  const generateImageMutation = useGenerateImage();

  // 生成思维过程步骤
  const generationSteps = [
    'Analyzing topic content and related background',
    'Building mind map structure framework',
    'Generating structured article content',
    'Creating topic-related illustrations',
    'Establishing relationships between content',
    'Refining details and optimizing layout',
  ];

  // 当topic变化时重置状态并启动生成
  useEffect(() => {
    if (topic) {
      // 重置所有状态
      setGeneratedContent(null);
      setRawAPIData(null);
      setApiError(null);
      setHasStartedGeneration(false);
      setGenerationStep(0);
      setIsRegenerating(false);
      requestIdRef.current = null;

      // 启动生成过程
      setIsGenerating(true);
    }
  }, [topic]);

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

    // 启动智能UI进度动画
    const stepTimeouts: NodeJS.Timeout[] = [];
    let isAPICompleted = false;

    // 步骤时间配置：前4个步骤按固定时间推进，最后2个步骤等待API
    const stepTimings = [
      { step: 1, delay: 2000 }, // 2秒后推进到第2个步骤
      { step: 2, delay: 4000 }, // 4秒后推进到第3个步骤
      { step: 3, delay: 6500 }, // 6.5秒后推进到第4个步骤
      // 后面的步骤会等待API返回
    ];

    // 安排前几个步骤的推进
    stepTimings.forEach(({ step, delay }) => {
      const timeout = setTimeout(() => {
        if (!isAPICompleted) {
          setGenerationStep(step);
        }
      }, delay);
      stepTimeouts.push(timeout);
    });

    // 8秒后开始最后两个步骤的等待状态
    const waitingStepTimeout = setTimeout(() => {
      if (!isAPICompleted) {
        setGenerationStep(4); // 开始第5个步骤

        // 12秒后进入最后一个步骤
        const finalStepTimeout = setTimeout(() => {
          if (!isAPICompleted) {
            setGenerationStep(5); // 最后一个步骤，等待API返回
          }
        }, 4000);
        stepTimeouts.push(finalStepTimeout);
      }
    }, 8000);
    stepTimeouts.push(waitingStepTimeout);

    // 清理函数
    const cleanup = () => {
      stepTimeouts.forEach((timeout) => clearTimeout(timeout));
    };

    // 调用API
    generateThread(
      { user_input: topic.trim() },
      {
        onSuccess: (response) => {
          // 检查请求是否还是当前请求（避免竞态条件）
          if (requestIdRef.current !== currentRequestId) {
            console.log('忽略过期的API响应');
            cleanup();
            return;
          }

          isAPICompleted = true;
          cleanup();
          console.log('API生成成功:', response);

          // 快速完成所有步骤
          const completeSteps = async () => {
            // 快速推进到最后几个步骤
            for (let i = 4; i < generationSteps.length; i++) {
              setGenerationStep(i);
              await new Promise((resolve) => setTimeout(resolve, 150)); // 快速推进
            }

            // 存储原始API数据
            setRawAPIData(response);

            // 转换API数据为组件所需格式
            const content = convertAPIDataToGeneratedContent(response);
            setGeneratedContent(content);
            setCurrentNodes(content.mindmap.nodes);
            setCurrentEdges(content.mindmap.edges);
            setIsGenerating(false);
            setGenerationStep(generationSteps.length - 1);
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

          isAPICompleted = true;
          cleanup();
          console.error('API生成失败:', error);
          const errorMessage = getErrorMessage(error);
          setApiError(errorMessage);
          setIsGenerating(false);
          setHasStartedGeneration(false); // 失败时重置，允许重试
          requestIdRef.current = null; // 清除请求ID
        },
      },
    );

    return cleanup;
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

  // 处理图片点击事件
  const handleImageClick = useCallback(
    (image: {
      url: string;
      alt: string;
      caption?: string;
      prompt?: string;
    }) => {
      setEditingImage(image);
      setIsImageEditModalOpen(true);
    },
    [],
  );

  /**
   * 更新或插入Tweet图片的Markdown内容
   * @param fullContent - 完整的Markdown字符串
   * @param tweetNumber - 目标Tweet的编号
   * @param newImageUrl - 新图片的URL
   * @param tweetText - Tweet的文本，用于alt标签
   * @returns 更新后的完整Markdown字符串
   */
  const updateTweetImageInContent = (
    fullContent: string,
    tweetNumber: string,
    newImageUrl: string,
    tweetText: string,
  ): string => {
    const imageMarkdown = `\n\n![${tweetText}](${newImageUrl})`;
    const tweetDivRegex = new RegExp(
      `(<div\s+data-tweet-id="${tweetNumber}"[^>]*>[\s\S]*?)(<\/div>)`,
    );
    const tweetBlockMatch = fullContent.match(tweetDivRegex);

    if (!tweetBlockMatch) {
      console.error(`无法找到 Tweet ${tweetNumber} 的区块。`);
      return fullContent;
    }

    const tweetBlock = tweetBlockMatch[0];
    const imageRegex = /!\[.*?\]\(https?:\/\/[^\s)]+\)/g;

    // 如果Tweet区块内已有图片，则替换它
    if (imageRegex.test(tweetBlock)) {
      return fullContent.replace(
        tweetBlock,
        tweetBlock.replace(imageRegex, imageMarkdown.trim()),
      );
    }
    // 如果没有图片，则在 </div> 前插入
    else {
      const openingDiv = tweetBlockMatch[1];
      const closingDiv = tweetBlockMatch[2];
      const updatedBlock = `${openingDiv.trim()}${imageMarkdown}\n\n${closingDiv}`;
      return fullContent.replace(tweetBlock, updatedBlock);
    }
  };

  // 新逻辑: 点击后不再自动生成图片，而是直接打开模态框
  const handleTweetImageEdit = useCallback((tweetData: any) => {
    setEditingTweetData(tweetData);
    setEditingImage({
      url: tweetData.image_url || '', // 如果没有图片URL，则传递空字符串
      alt: tweetData.content || tweetData.title || '',
      caption: tweetData.title,
      prompt: tweetData.content || tweetData.title,
    });
    setIsImageEditModalOpen(true);
  }, []);

  // 新逻辑: 精确地将选中的图片URL更新到Markdown中
  const handleImageUpdate = useCallback(
    (newImage: {
      url: string;
      alt: string;
      caption?: string;
      prompt?: string;
    }) => {
      if (!editingTweetData) return;

      const { tweet_number, content: tweetText, title } = editingTweetData;
      const currentMarkdown =
        regeneratedMarkdown ||
        (rawAPIData ? convertAPIDataToMarkdown(rawAPIData) : '');

      // 1. 更新Markdown内容
      const updatedMarkdown = updateTweetImageInContent(
        currentMarkdown,
        tweet_number.toString(),
        newImage.url,
        newImage.alt || tweetText || title, // 优先使用 newImage 的 alt
      );
      setRegeneratedMarkdown(updatedMarkdown);

      // 2. 更新 rawAPIData 中的图片URL，以保持数据同步
      if (rawAPIData) {
        const updatedNodes = rawAPIData.nodes.map((group: any) => ({
          ...group,
          tweets: group.tweets.map((tweet: any) =>
            tweet.tweet_number === tweet_number
              ? { ...tweet, image_url: newImage.url }
              : tweet,
          ),
        }));
        setRawAPIData({ ...rawAPIData, nodes: updatedNodes });
      }

      // 3. 关闭模态框并重置状态
      setIsImageEditModalOpen(false);
      setEditingImage(null);
      setEditingTweetData(null);
    },
    [editingTweetData, rawAPIData, regeneratedMarkdown],
  );

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
      const topicNode = currentNodes.find((n) => n.type === 'topic');
      if (topicNode) {
        newOutlineStructure.topic = topicNode.label;
      }

      // 更新大纲点和tweets
      const outlineNodes = currentNodes.filter(
        (n) => n.type === 'outline_point',
      );
      const tweetNodes = currentNodes.filter((n) => n.type === 'tweet');

      // 重新构建 nodes 数组
      newOutlineStructure.nodes = outlineNodes.map((outlineNode) => {
        const outlineIndex = outlineNode.data?.outlineIndex;
        const originalNode = rawAPIData.nodes[outlineIndex!] || { tweets: [] };

        // 找到属于这个 outline 的所有 tweets
        const relatedTweets = tweetNodes
          .filter((t) => t.data?.groupIndex === outlineIndex)
          .map((tweetNode) => {
            const originalTweet =
              originalNode.tweets.find(
                (t) => t.tweet_number === tweetNode.data?.tweetId,
              ) || {};

            return {
              ...(originalTweet as TweetContentItem),
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
        const { nodes: newNodes, edges: newEdges } =
          convertThreadDataToMindmap(newOutline);
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
  }, [
    rawAPIData,
    currentNodes,
    currentEdges,
    modifyOutlineMutation,
    generatedContent,
  ]);

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
    shouldShowLoading: isGenerating || (!generatedContent && apiError),
  });

  if (isGenerating || (!generatedContent && !rawAPIData)) {
    const hasError = !isGenerating && !!apiError;

    return (
      <ContentGenerationLoading
        topic={topic}
        onBack={onBack}
        isError={hasError}
        errorMessage={apiError || undefined}
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
              isRegenerating={isRegenerating} // 传递 loading 状态
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
                onImageClick={handleImageClick}
                onTweetImageEdit={handleTweetImageEdit}
                highlightedSection={hoveredTweetId}
                hoveredTweetId={hoveredTweetId}
                imageData={generatedContent?.image}
                tweetData={rawAPIData}
                loadingTweetId={loadingTweetId}
              />
            )}
          </div>
        </div>
      </div>

      {/* 图片编辑模态框 */}
      {isImageEditModalOpen && editingImage && rawAPIData && (
        <ImageEditModal
          image={editingImage}
          targetTweet={
            editingTweetData?.content || editingTweetData?.title || ''
          }
          tweetThread={rawAPIData.nodes
            .flatMap((group: any) => group.tweets)
            .map(
              (tweet: any, index: number) =>
                `(${index + 1}) ${tweet.content || tweet.title}`,
            )
            .join(' \n')}
          onImageUpdate={handleImageUpdate}
          onClose={() => {
            setIsImageEditModalOpen(false);
            setEditingImage(null);
            setEditingTweetData(null);
          }}
        />
      )}
    </div>
  );
}
