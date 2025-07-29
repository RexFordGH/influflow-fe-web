'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Image } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import { addToast } from '@/components/base/toast';
import {
  getErrorMessage,
  useCheckTwitterAuthStatus,
  useGenerateImage,
  useGenerateThread,
  useModifyOutline,
  useModifyTweet,
  usePostToTwitter,
  type TwitterPostRequest,
  type TwitterTweetData,
} from '@/lib/api/services';
import {
  convertAPIDataToGeneratedContent,
  convertThreadDataToMindmap,
} from '@/lib/data/converters';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { ContentFormat } from '@/types/api';
import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import { Outline, TweetContentItem } from '@/types/outline';
import { devLog } from '@/utils/devLog';
import { convertToTwitterFormat, copyTwitterContent } from '@/utils/twitter';

import { CreateArticleLoading } from './CreateLoading';
import { ImageEditModal } from './markdown/ImageEditModal';
import { MarkdownRenderer } from './markdown/MarkdownRenderer';
import EditableContentMindmap from './mindmap/MindmapRenderer';

interface ArticleRendererProps {
  topic: string;
  contentFormat: ContentFormat;
  onBack: () => void;
  initialData?: Outline;
  onDataUpdate?: () => void; // 新增：数据更新回调
}

interface CollectedImage {
  src: string;
  alt: string;
  originalSectionId: string;
  tweetId?: string;
}

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Image ?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this image?
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onPress={onClose}
            className="rounded-full bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            className="rounded-full"
            onPress={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ArticleRenderer({
  topic,
  contentFormat,
  onBack,
  initialData,
  onDataUpdate,
}: ArticleRendererProps) {
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

  // regeneratedMarkdown 不再需要，直接使用 rawAPIData
  const [loadingTweetId, setLoadingTweetId] = useState<string | null>(null); // markdown loading状态
  const [generatingImageTweetIds, setGeneratingImageTweetIds] = useState<
    string[]
  >([]); // 正在生图的tweetId数组
  const [scrollToSection, setScrollToSection] = useState<string | null>(null); // 滚动到指定section
  const [isPostingToTwitter, setIsPostingToTwitter] = useState(false); // Twitter发布loading状态
  const [localImageUrls, setLocalImageUrls] = useState<Record<string, string>>(
    {},
  );
  const [isCopyingFullContent, setIsCopyingFullContent] = useState(false); // Copy full content loading状态

  // 从 longform 内容中提取的图片
  const [collectedImages, setCollectedImages] = useState<CollectedImage[]>([]);
  // processedMarkdown 不再需要，直接使用 rawAPIData

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<CollectedImage | null>(
    null,
  );
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // AI 编辑相关状态
  const [selectedNodeForAI, setSelectedNodeForAI] = useState<string | null>(
    null,
  );
  const [showAIEditModal, setShowAIEditModal] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // 辅助函数：添加正在生图的 tweetId
  const addGeneratingImageTweetId = useCallback((tweetId: string) => {
    setGeneratingImageTweetIds((prev) => [
      ...prev.filter((id) => id !== tweetId),
      tweetId,
    ]);
  }, []);

  // 辅助函数：移除正在生图的 tweetId
  const removeGeneratingImageTweetId = useCallback((tweetId: string) => {
    setGeneratingImageTweetIds((prev) => prev.filter((id) => id !== tweetId));
  }, []);

  // 辅助函数：清空所有正在生图的 tweetId
  const clearGeneratingImageTweetIds = useCallback(() => {
    setGeneratingImageTweetIds([]);
  }, []);

  // 辅助函数：检查是否正在生图
  const isGeneratingImage = useCallback(
    (tweetId: string | null | undefined) => {
      return tweetId ? generatingImageTweetIds.includes(tweetId) : false;
    },
    [generatingImageTweetIds],
  );

  // 使用 ref 来追踪请求状态，避免严格模式下的重复执行
  const requestIdRef = useRef<string | null>(null);

  // 清除滚动状态，防止重复滚动
  useEffect(() => {
    if (scrollToSection) {
      // 在滚动执行后清除状态，延迟时间应该比EnhancedMarkdownRenderer中的延迟时间长
      const timer = setTimeout(() => {
        setScrollToSection(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [scrollToSection]);

  // 获取用户信息用于个性化设置
  const { user } = useAuthStore();

  // API调用hook
  const { mutate: generateThread, isPending: isGeneratingAPI } =
    useGenerateThread();
  const modifyOutlineMutation = useModifyOutline();
  const modifyTweetMutation = useModifyTweet();
  const generateImageMutation = useGenerateImage();
  const postToTwitterMutation = usePostToTwitter();
  const { data: twitterAuthStatus, refetch: refetchTwitterAuthStatus } =
    useCheckTwitterAuthStatus();

  // 生成思维过程步骤
  const generationSteps = [
    'Analyzing topic content and related background',
    'Building mind map structure framework',
    'Generating structured article content',
    // 'Creating topic-related illustrations',
    'Establishing relationships between content',
    'Refining details and optimizing layout',
  ];

  // 当topic变化时重置状态并启动生成
  useEffect(() => {
    if (topic && !initialData) {
      // 重置所有状态
      setGeneratedContent(null);
      setRawAPIData(null);
      setApiError(null);
      setHasStartedGeneration(false);
      setGenerationStep(0);
      setIsRegenerating(false);
      requestIdRef.current = null;
      // 关键修复：在这里启动生成流程
      setIsGenerating(true);

      // 关键：当 topic 变化时，重置本地图片URL状态
      setLocalImageUrls({});
    }
  }, [topic, initialData]);

  // 新增：处理 initialData 的逻辑
  useEffect(() => {
    if (initialData) {
      // 如果有初始数据，直接渲染，跳过 API 调用
      setRawAPIData(initialData);
      const content = convertAPIDataToGeneratedContent(initialData);
      setGeneratedContent(content);
      setCurrentNodes(content.mindmap.nodes);
      setCurrentEdges(content.mindmap.edges);
      setIsGenerating(false);

      // 关键：当 initialData 变化时，重置本地图片URL状态
      setLocalImageUrls({});
    }
  }, [initialData]);

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

    // 解析topic中的参考推文
    let userInput = topic.trim();
    let referenceUrls: string[] = [];

    // 检查是否包含参考推文的格式
    const referenceMatch = userInput.match(
      /\.\s*Reference these popular posts:\s*(.+)$/,
    );
    if (referenceMatch) {
      // 提取纯净的topic（不包含参考推文部分）
      userInput = userInput.replace(referenceMatch[0], '').trim();
      // 提取参考推文URL列表
      referenceUrls = referenceMatch[1].split(',').map((url) => url.trim());
    }

    // 重新组装user_input，使用正确的格式
    if (referenceUrls.length > 0) {
      userInput = `${userInput}. Reference Tweets: ${referenceUrls.join(',')}`;
    }

    // 准备请求数据，包含用户个性化信息
    const requestData = {
      user_input: userInput,
      content_format: contentFormat,
      ...(user && {
        personalization: {
          tone: user.tone,
          bio: user.bio,
          tweet_examples: user.tweet_examples,
        },
      }),
    };

    // 调用API
    generateThread(requestData, {
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
            await new Promise((resolve) => setTimeout(resolve, 500)); // 快速推进
          }

          // 存储原始API数据，确保包含 id
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

        // 显示错误 toast
        addToast({
          title: 'Failed to generate content',
          description: errorMessage,
          color: 'danger',
          timeout: 3000,
        });

        // 返回首页
        onBack();
      },
    });

    return cleanup;
  }, [
    topic,
    isGenerating,
    hasStartedGeneration,
    generateThread,
    generationSteps.length,
    onBack,
  ]);

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);

      // 根据选中的节点高亮对应的推文
      if (nodeId && currentNodes) {
        const node = currentNodes.find((n) => n.id === nodeId);
        if (node && node.data?.tweetId) {
          const tweetId = node.data.tweetId.toString();
          setHoveredTweetId(tweetId);
          // 设置滚动目标为tweetId
          setScrollToSection(tweetId);
        } else if (node && node.data?.groupIndex !== undefined) {
          // 如果是group节点，滚动到group
          const groupId = `group-${node.data.groupIndex}`;
          setHoveredTweetId(groupId);
          setScrollToSection(groupId);
        } else {
          setHoveredTweetId(null);
          setScrollToSection(null);
        }
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

  // 处理 Edit with AI 按钮点击
  const handleEditWithAI = useCallback((nodeId: string) => {
    setSelectedNodeForAI(nodeId);
    setShowAIEditModal(true);
  }, []);

  // 处理 AI 编辑指令提交
  const handleAIEditSubmit = async () => {
    if (!selectedNodeForAI || !aiEditInstruction.trim()) return;

    setIsAIProcessing(true);

    try {
      // 检查是否有当前outline数据
      if (!rawAPIData) {
        console.error('缺少原始outline数据，无法进行AI编辑');
        setIsAIProcessing(false);
        return;
      }

      // 找到要编辑的节点，获取对应的tweet_number
      const targetNode = currentNodes.find((node) => {
        // 支持多种ID格式匹配
        if (node.id === selectedNodeForAI) return true;
        if (node.data?.tweetId?.toString() === selectedNodeForAI) return true;
        if (
          selectedNodeForAI.startsWith('group-') &&
          node.id === selectedNodeForAI
        )
          return true;
        return false;
      });

      if (!targetNode || !targetNode.data?.tweetId) {
        console.error('未找到目标节点或缺少tweetId:', selectedNodeForAI);
        setIsAIProcessing(false);
        return;
      }

      const tweetNumber = targetNode.data.tweetId;

      // 调用 useModifyTweet API
      const result = await modifyTweetMutation.mutateAsync({
        outline: rawAPIData,
        tweet_number: tweetNumber,
        modification_prompt: aiEditInstruction,
      });

      // API只返回更新的tweet内容，需要局部更新
      if (result.updated_tweet_content) {
        console.log('AI编辑成功，返回的数据:', result);

        // 1. 更新rawAPIData中对应的tweet内容
        const updatedOutline = JSON.parse(
          JSON.stringify(rawAPIData),
        ) as Outline;
        let tweetFound = false;

        for (const outlineNode of updatedOutline.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(
            (tweet) => tweet.tweet_number === tweetNumber,
          );
          if (tweetToUpdate) {
            tweetToUpdate.content = result.updated_tweet_content;
            tweetFound = true;
            break;
          }
        }

        if (!tweetFound) {
          console.error('未找到对应的tweet_number:', tweetNumber);
          return;
        }

        // 2. 更新rawAPIData状态
        setRawAPIData(updatedOutline);

        // 3. 保存到 Supabase
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('tweet_thread')
            .update({ tweets: updatedOutline.nodes })
            .eq('id', rawAPIData.id);

          if (error) {
            throw error;
          }
          console.log('AI edited content saved successfully to Supabase.');

          // 成功保存后，触发侧边栏数据刷新
          onDataUpdate?.();
        } catch (saveError) {
          console.error(
            'Error saving AI edited content to Supabase:',
            saveError,
          );
          addToast({
            title: 'Warning',
            description: 'Content updated locally but failed to save to server',
          });
        }

        // 4. 重新生成内容
        const content = convertAPIDataToGeneratedContent(updatedOutline);
        setGeneratedContent(content);
        setCurrentNodes(content.mindmap.nodes);
        setCurrentEdges(content.mindmap.edges);

        // 5. 重新生成markdown - 不再需要，直接使用 Outline 数据
        // setRegeneratedMarkdown 不再需要

        addToast({
          title: 'Success',
          description: 'Content updated successfully',
        });
        // 清理对应的状态
      }
    } catch (error) {
      console.error('AI编辑失败:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update content',
      });
    } finally {
      setIsAIProcessing(false);
      setShowAIEditModal(false);
      setAiEditInstruction('');
      setSelectedNodeForAI(null);
    }
  };

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


  // 新逻辑: 点击后不再自动生成图片，而是直接打开模态框
  const handleTweetImageEdit = useCallback(
    (tweetData: any) => {
      setEditingTweetData(tweetData);
      setEditingImage({
        url: tweetData.image_url || '', // 如果没有图片URL，则传递空字符串
        alt: tweetData.content || tweetData.title || '',
        caption: tweetData.content,
        prompt: tweetData.content || tweetData.title,
      });
      // 设置正在生图的 tweetId，用于高亮显示
      const tweetId = tweetData.tweet_number?.toString();
      if (tweetId) {
        addGeneratingImageTweetId(tweetId);
      }
      setIsImageEditModalOpen(true);
    },
    [addGeneratingImageTweetId],
  );

  // 新逻辑: 精确地将选中的图片URL更新到Markdown中
  const handleImageUpdate = useCallback(
    async (
      newImage: {
        url: string;
        alt: string;
        caption?: string;
        prompt?: string;
      },
      tweetData?: any, // 新增：可选的tweetData参数，用于直接生图场景
    ) => {
      // 优先使用传入的tweetData，如果没有则使用editingTweetData
      const targetTweetData = tweetData || editingTweetData;

      if (!targetTweetData) {
        console.error(
          'handleImageUpdate: tweetData 和 editingTweetData 都为空',
        );
        return;
      }

      const { tweet_number, content: tweetText, title } = targetTweetData;

      // 使用 useState 的函数式更新来避免竞态条件
      // 这样每次更新都基于最新的状态，而不是闭包中的旧状态

      let latestRawAPIData: any = null;

      // 1. 更新 rawAPIData 中的图片URL（使用函数式更新）
      setRawAPIData((prevRawAPIData) => {
        if (!prevRawAPIData) return prevRawAPIData;

        const updatedNodes = prevRawAPIData.nodes.map((group: any) => ({
          ...group,
          tweets: group.tweets.map((tweet: any) =>
            tweet.tweet_number === tweet_number
              ? { ...tweet, image_url: newImage.url }
              : tweet,
          ),
        }));

        latestRawAPIData = { ...prevRawAPIData, nodes: updatedNodes };
        return latestRawAPIData;
      });

      // 2. 更新Markdown内容 - 不再需要，因为直接使用 Outline 数据
      // Markdown 内容由 MarkdownRenderer 直接从 Outline 数据生成

      // 3. 更新 Supabase 数据库（使用最新的数据）
      if (latestRawAPIData && latestRawAPIData.id) {
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('tweet_thread')
            .update({ tweets: latestRawAPIData.nodes })
            .eq('id', latestRawAPIData.id);

          if (error) {
            throw error;
          }
          console.log('Tweet image updated successfully in Supabase.');

          // 成功更新后，触发侧边栏数据刷新
          onDataUpdate?.();
        } catch (error) {
          console.error('Error updating tweet image in Supabase:', error);
        }
      }

      // 4. 关闭模态框并重置状态
      setIsImageEditModalOpen(false);
      setEditingImage(null);

      // 只有在使用editingTweetData时才清除它（即从弹窗调用时）
      // 如果是直接生图调用，则不清除，因为状态管理在handleDirectGenerate中
      if (!tweetData) {
        setEditingTweetData(null);
      }

      // 清除生图高亮状态（使用正确的 tweetData）
      const currentTweetId = (
        tweetData || editingTweetData
      )?.tweet_number?.toString();
      if (currentTweetId) {
        removeGeneratingImageTweetId(currentTweetId);
      }

      // 新增：清理本地预览URL
      const localUrl = localImageUrls[targetTweetData.tweet_number];
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
        setLocalImageUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[targetTweetData.tweet_number];
          return newUrls;
        });
      }
    },
    [
      editingTweetData,
      onDataUpdate,
      removeGeneratingImageTweetId,
      localImageUrls,
    ],
  );

  // 新增：处理本地图片选择，立即显示预览
  const handleImageSelect = useCallback(
    (result: { localUrl: string; file: File }, tweetData: any) => {
      setLocalImageUrls((prev) => ({
        ...prev,
        [tweetData.tweet_number]: result.localUrl,
      }));
    },
    [],
  );

  // For local image uploads, this function will be called
  const handleLocalImageUpload = useCallback(
    (result: { url: string; alt: string }, tweetData: any) => {
      // Directly use the existing image update logic
      handleImageUpdate(result, tweetData);
    },
    [handleImageUpdate],
  );

  const handleDirectGenerate = useCallback(
    async (tweetData: any) => {
      if (!tweetData) return;

      const tweetId = tweetData.tweet_number?.toString();
      if (!tweetId) return;

      addGeneratingImageTweetId(tweetId);

      try {
        const imageUrl = await generateImageMutation.mutateAsync({
          target_tweet: tweetData.content || tweetData.title || '',
          tweet_thread: rawAPIData
            ? rawAPIData.nodes
                .flatMap((group: any) => group.tweets)
                .map(
                  (tweet: any, index: number) =>
                    `(${index + 1}) ${tweet.content || tweet.title}`,
                )
                .join(' \n')
            : '',
        });

        // 自动应用图片
        const newImage = {
          url: imageUrl,
          alt: tweetData.content || tweetData.title || '',
          caption: tweetData.content,
          prompt: tweetData.content || tweetData.title,
        };

        // 直接调用更新逻辑，将tweetData作为参数传递
        await handleImageUpdate(newImage, tweetData);

        addToast({
          title: 'Image generated successfully',
          color: 'success',
        });
      } catch (error) {
        console.error('Direct image generation failed:', error);
        addToast({
          title: 'Image generation failed',
          color: 'danger',
        });
      } finally {
        // 清除loading状态
        removeGeneratingImageTweetId(tweetId);
        // 注意：不在这里清除editingTweetData，因为handleImageUpdate会清除
      }
    },
    [
      rawAPIData,
      generateImageMutation,
      handleImageUpdate,
      addGeneratingImageTweetId,
      removeGeneratingImageTweetId,
    ],
  );

  const handleTweetContentChange = useCallback(
    async (tweetId: string, newContent: string) => {
      console.log('handleTweetContentChange', tweetId, newContent, rawAPIData);
      if (!rawAPIData || !rawAPIData.id) return;

      // 更新 rawAPIData 状态
      const updatedNodes = rawAPIData.nodes.map((group: any) => ({
        ...group,
        tweets: group.tweets.map((tweet: any) =>
          tweet.tweet_number.toString() === tweetId
            ? { ...tweet, content: newContent }
            : tweet,
        ),
      }));
      const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };
      setRawAPIData(updatedRawAPIData);

      // 更新 Supabase
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('tweet_thread')
          .update({ tweets: updatedRawAPIData.nodes })
          .eq('id', rawAPIData.id);

        if (error) {
          throw error;
        }
        console.log('Tweet content updated successfully in Supabase.');

        // 成功更新后，触发侧边栏数据刷新
        onDataUpdate?.();
      } catch (error) {
        console.error('Error updating tweet content in Supabase:', error);
        // 可以在这里添加一些错误处理逻辑，比如 toast 通知
      }
    },
    [rawAPIData, onDataUpdate],
  );

  const handleGroupTitleChange = useCallback(
    async (groupId: string, newTitle: string) => {
      if (!rawAPIData || !rawAPIData.id) return;

      const updatedNodes = rawAPIData.nodes.map((group: any, index: number) => {
        if (group.group_id === groupId || index.toString() === groupId) {
          return { ...group, title: newTitle };
        }
        return group;
      });

      const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };
      setRawAPIData(updatedRawAPIData);

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('tweet_thread')
          .update({ tweets: updatedRawAPIData.nodes })
          .eq('id', rawAPIData.id);

        if (error) {
          throw error;
        }
        console.log('Group title updated successfully in Supabase.');
        onDataUpdate?.();
      } catch (error) {
        console.error('Error updating group title in Supabase:', error);
      }
    },
    [rawAPIData, onDataUpdate],
  );

  // 当 rawAPIData 更新时，预处理内容，提取图片
  useEffect(() => {
    if (contentFormat !== 'longform' || !rawAPIData) {
      setCollectedImages([]);
      return;
    }

    const images: CollectedImage[] = [];
    // 直接从 rawAPIData 遍历以可靠地提取图片信息
    rawAPIData.nodes.forEach((group: any) => {
      if (group.tweets && Array.isArray(group.tweets)) {
        group.tweets.forEach((tweet: any) => {
          if (tweet.image_url) {
            images.push({
              src: tweet.image_url,
              alt: tweet.content || tweet.title || 'Image',
              originalSectionId: `tweet-${tweet.tweet_number}`,
              tweetId: tweet.tweet_number.toString(),
            });
          }
        });
      }
    });
    setCollectedImages(images);
  }, [rawAPIData, contentFormat]);


  const handleDeleteImage = useCallback(
    (image: CollectedImage) => {
      console.log('handleDeleteImage called in Generation. Image:', image);
      if (!rawAPIData) {
        console.error('Cannot delete image: rawAPIData is not available.');
        addToast({
          title: '无法删除图片',
          description: '缺少必要的数据，请稍后重试。',
          color: 'danger',
        });
        return;
      }
      setImageToDelete(image);
      setIsDeleteModalOpen(true);
    },
    [rawAPIData],
  );

  useEffect(() => {
    console.log('isDeleteModalOpen state changed:', isDeleteModalOpen);
  }, [isDeleteModalOpen]);

  const confirmDeleteImage = useCallback(async () => {
    if (!imageToDelete) return;

    setIsDeletingImage(true); // 开始删除，设置loading为true

    const targetTweetId = imageToDelete.tweetId;
    if (!rawAPIData || !rawAPIData.id || !targetTweetId) {
      console.error('cannot delete image: missing necessary data');
      setIsDeletingImage(false); // 结束loading
      return;
    }

    // 1. 更新 rawAPIData
    const updatedNodes = rawAPIData.nodes.map((group: any) => ({
      ...group,
      tweets: group.tweets.map((tweet: any) => {
        if (tweet.tweet_number.toString() === targetTweetId) {
          return { ...tweet, image_url: null };
        }
        return tweet;
      }),
    }));

    const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };
    setRawAPIData(updatedRawAPIData);

    // 2. 更新 Supabase
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tweet_thread')
        .update({ tweets: updatedRawAPIData.nodes })
        .eq('id', rawAPIData.id);

      if (error) throw error;

      addToast({ title: 'Image deleted successfully', color: 'success' });
      onDataUpdate?.();
    } catch (error) {
      console.error('Delete image failed:', error);
      addToast({
        title: 'Delete failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
      setRawAPIData(rawAPIData); // 发生错误时回滚状态
    } finally {
      // 3. 关闭弹窗并重置状态
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
      setIsDeletingImage(false); // 结束删除，设置loading为false
    }
  }, [rawAPIData, imageToDelete, onDataUpdate]);

  const handleRegenerateClick = useCallback(async () => {
    console.log('rawAPIData:', rawAPIData);
    console.log('currentNodes:', currentNodes);

    if (!rawAPIData) {
      console.error('cannot regenerate: missing necessary data');
      return;
    }

    console.log('start setting loading state...');
    setIsRegenerating(true);

    try {
      // 从当前思维导图状态构建新的 outline 结构
      const currentOutlineFromMindmap = {
        id: rawAPIData.id,
        topic: rawAPIData.topic,
        content_format: rawAPIData.content_format || ('longform' as const),
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

            // 检查标题是否发生变化
            const originalTitle = (originalTweet as any).title;
            const currentTitle = tweetNode.label;
            const titleChanged = currentTitle !== originalTitle;

            console.log('🔍 标题变化检测:', {
              tweetId: tweetNode.data?.tweetId,
              originalTitle,
              currentTitle,
              titleChanged,
              originalTweet,
            });

            const result = {
              ...(originalTweet as TweetContentItem),
              title: tweetNode.label, // 使用编辑后的标题
              tweet_number: tweetNode.data?.tweetId || 0,
              // 如果标题变化了，清空 content，让后端重新生成
              ...(titleChanged && { content: '' }),
            };

            console.log('🔍 构建的推文数据:', result);

            return result;
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

        // 保存最新数据到 Supabase（不是拉取旧数据）
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('tweet_thread')
            .update({
              tweets: newOutline.nodes,
              topic: newOutline.topic,
              content_format: newOutline.content_format,
            })
            .eq('id', rawAPIData.id);

          if (error) {
            throw error;
          }

          console.log('最新数据已保存到 Supabase');

          // 更新所有状态
          setRawAPIData(newOutline);

          // 重新构建思维导图
          const { nodes: newNodes, edges: newEdges } =
            convertThreadDataToMindmap(newOutline);
          setCurrentNodes(newNodes);
          setCurrentEdges(newEdges);

          // 不再需要重新生成 markdown，直接使用 newOutline

          // 更新生成的内容
          if (generatedContent) {
            const updatedContent = convertAPIDataToGeneratedContent(newOutline);
            setGeneratedContent({
              ...generatedContent,
              ...updatedContent,
            });
          }

          // 触发侧边栏数据刷新
          onDataUpdate?.();
        } catch (dbError) {
          console.error(
            '保存数据到 Supabase 失败，但仍使用 API 返回的数据:',
            dbError,
          );

          // 如果数据库保存失败，仍使用 API 返回的数据更新本地状态
          setRawAPIData(newOutline);

          // 重新构建思维导图
          const { nodes: newNodes, edges: newEdges } =
            convertThreadDataToMindmap(newOutline);
          setCurrentNodes(newNodes);
          setCurrentEdges(newEdges);

          // 不再需要重新生成 markdown，直接使用 newOutline

          // 更新生成的内容
          if (generatedContent) {
            const updatedContent = convertAPIDataToGeneratedContent(newOutline);
            setGeneratedContent({
              ...generatedContent,
              ...updatedContent,
            });
          }
        }
      }
    } catch (error) {
      console.error('Regenerate 失败:', error);
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

  // Twitter发布逻辑
  const handlePostToTwitter = useCallback(async () => {
    addToast({
      title: 'One-click tweet coming soon!',
      color: 'warning',
      timeout: 5000,
    });

    if (!rawAPIData) {
      addToast({
        title: '没有可发布的内容',
        color: 'warning',
      });
      return;
    }

    setIsPostingToTwitter(true);

    try {
      // // 1. 检查Twitter授权状态
      // const authStatus = await refetchTwitterAuthStatus();

      // if (!authStatus.data?.authorized) {
      //   // 2. 用户未授权，获取授权链接并打开新窗口
      //   const authUrlResponse = await getTwitterAuthUrl();
      //   window.open(authUrlResponse.authorization_url, '_blank');

      //   addToast({
      //     title: 'Twitter授权',
      //     description: '请在新窗口中完成Twitter授权，然后回到此页面重试发布',
      //     color: 'warning',
      //     timeout: 5000,
      //   });
      //   return;
      // }

      // 3. 用户已授权，构建推文数据
      const tweets: TwitterTweetData[] = rawAPIData.nodes
        .flatMap((group: any) => group.tweets)
        .map((tweet: any, index: number) => {
          const totalTweets = rawAPIData.nodes.reduce(
            (total: number, g: any) => total + g.tweets.length,
            0,
          );
          const tweetNumber = index + 1;
          const content = tweet.content || tweet.title || '';
          const text = `${tweetNumber}/${totalTweets}\n\n${content}`;

          const tweetData: TwitterTweetData = { text };

          // 如果推文有图片，添加图片URL
          if (tweet.image_url) {
            tweetData.image_url = tweet.image_url;
          }

          return tweetData;
        });

      const postRequest: TwitterPostRequest = {
        tweets,
        delay_seconds: 1, // 推文间隔1秒
      };

      // 后端暂时不用，发请求用于后端打 log
      postToTwitterMutation.mutateAsync(postRequest);

      // 4. 发布到Twitter
      // const response = await postToTwitterMutation.mutateAsync(postRequest);

      // addToast({
      //   title: '发布成功！',
      //   description: `成功发布 ${response.successful_tweets}/${response.total_tweets} 条推文`,
      //   color: 'success',
      // });
    } catch (error) {
      console.error('Twitter发布失败:', error);
      addToast({
        title: '发布失败',
        description: getErrorMessage(error),
        color: 'danger',
      });
    } finally {
      setIsPostingToTwitter(false);
    }
  }, [rawAPIData, postToTwitterMutation, refetchTwitterAuthStatus]);

  // Handle copying of full content
  const handleCopyFullContent = useCallback(async () => {
    if (!rawAPIData) return;

    setIsCopyingFullContent(true);

    try {
      // 1. Define a helper function for emoji numbers
      const getEmojiNumber = (index: number) => {
        const emojiNumbers = [
          '1️⃣',
          '2️⃣',
          '3️⃣',
          '4️⃣',
          '5️⃣',
          '6️⃣',
          '7️⃣',
          '8️⃣',
          '9️⃣',
          '🔟',
        ];
        return emojiNumbers[index] || `${index + 1}️⃣`;
      };

      // 2. Format each part individually and collect them
      const contentParts: string[] = [];
      if (rawAPIData.topic) {
        contentParts.push(convertToTwitterFormat(rawAPIData.topic));
      }
      rawAPIData.nodes.forEach((group: any, groupIndex: number) => {
        if (group.title) {
          const emojiNumber = getEmojiNumber(groupIndex);
          const titleWithEmoji = `${emojiNumber} ${group.title}`;
          contentParts.push(convertToTwitterFormat(titleWithEmoji));
        }
        group.tweets.forEach((tweet: any) => {
          if (tweet.content || tweet.title) {
            contentParts.push(
              convertToTwitterFormat(tweet.content || tweet.title),
            );
          }
        });
      });

      // 3. Join the pre-formatted parts
      const fullContent = contentParts.join('\n\n\n');

      // 4. Get the URL of the first image, if any
      const firstImageUrl =
        collectedImages.length > 0 ? collectedImages[0].src : undefined;

      // 5. Call the existing, verified copyTwitterContent function
      // This function handles text formatting, image fetching, PNG conversion, and clipboard writing
      await copyTwitterContent(fullContent, firstImageUrl);
    } catch (error) {
      // Errors are handled by copyTwitterContent, but we can log here
      console.error('Error during copy operation:', error);
    } finally {
      setIsCopyingFullContent(false);
    }
  }, [rawAPIData, collectedImages]);

  const formatTime = useCallback((date: number | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // 调试状态
  // console.log('Render 条件检查:', {
  //   isGenerating,
  //   generatedContent: !!generatedContent,
  //   apiError,
  //   shouldShowLoading: isGenerating || (!generatedContent && apiError),
  // });

  if (isGenerating || (!generatedContent && !rawAPIData && !initialData)) {
    const hasError = !isGenerating && !!apiError;

    return (
      <CreateArticleLoading
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
              size="sm"
              variant="light"
              onPress={onBack}
              className="text-gray-600"
              startContent={<ChevronLeftIcon className="size-4" />}
            >
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            {/* 如果是 longform 模式，显示复制全文按钮 */}
            {contentFormat === 'longform' && (
              <Button
                size="sm"
                variant="light"
                onPress={handleCopyFullContent}
                isLoading={isCopyingFullContent}
                disabled={isCopyingFullContent}
                className="bg-black/15"
              >
                Copy
              </Button>
            )}
            <Button
              size="sm"
              color="primary"
              onPress={handlePostToTwitter}
              isLoading={isPostingToTwitter}
              className="bg-[#1DA1F2] text-white hover:bg-[#1991DB]"
              // startContent={!isPostingToTwitter && <Image src="/icons/twitter.svg" alt="Twitter" width={16} height={16} />}
            >
              {isPostingToTwitter ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧思维导图 */}
        <div className="relative flex-1 border-r border-gray-200 bg-white">
          <ReactFlowProvider>
            <EditableContentMindmap
              nodes={currentNodes}
              edges={currentEdges}
              originalOutline={rawAPIData || undefined} // 传入原始outline数据
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onRegenerateClick={handleRegenerateClick} // 传入 API 重生成回调
              highlightedNodeId={selectedNodeId}
              hoveredTweetId={hoveredTweetId}
              isRegenerating={isRegenerating} // 传递 loading 状态
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex flex-1 justify-center bg-white">
          <div className="margin-auto font-inter flex w-[628px] flex-col overflow-scroll   px-[24px] pb-[60px]">
            {/* 标题区域 */}
            <div className="pt-[24px]">
              <h1 className="font-inter text-[32px] font-[700] leading-none text-black">
                {rawAPIData?.topic}
              </h1>
              <p className="font-inter mt-[10px] text-[14px] font-[400] leading-none text-[#8C8C8C]">
                {formatTime(rawAPIData?.updatedAt || Date.now())}
              </p>
            </div>
            {/* Twitter Thread内容区域 */}
            {contentFormat === 'longform' ? (
              <div className="mt-[50px]  flex items-start justify-center">
                <div className="size-[40px] shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={user?.avatar}
                    width={40}
                    height={40}
                    alt={user?.name}
                    className="overflow-hidden rounded-full object-cover"
                  />
                </div>

                <div>
                  <div className="ml-[12px] flex gap-[4px] text-[16px] leading-none">
                    <span className=" font-[600] text-black">{user?.name}</span>
                    {user?.account_name && (
                      <span className="text-[#5C6D7A]">
                        @{user?.account_name}
                      </span>
                    )}
                  </div>
                  {/* Thread 内容 */}
                  {rawAPIData && (
                    <MarkdownRenderer
                      content={rawAPIData}
                      onSectionHover={handleMarkdownHover}
                      onSourceClick={handleSourceClick}
                      onImageClick={handleImageClick}
                      onTweetImageEdit={handleTweetImageEdit}
                      onTweetContentChange={handleTweetContentChange}
                      onGroupTitleChange={handleGroupTitleChange}
                      onLocalImageUploadSuccess={handleLocalImageUpload}
                      onImageSelect={handleImageSelect} // 新增
                      onDirectGenerate={handleDirectGenerate}
                      onEditWithAI={handleEditWithAI}
                      highlightedSection={hoveredTweetId}
                      hoveredTweetId={hoveredTweetId}
                      selectedNodeId={selectedNodeId}
                      editingNodeId={selectedNodeForAI}
                      imageData={generatedContent?.image}
                      tweetData={rawAPIData}
                      loadingTweetId={loadingTweetId}
                      generatingImageTweetIds={generatingImageTweetIds}
                      localImageUrls={localImageUrls} // 新增
                      scrollToSection={scrollToSection}
                      collectedImages={collectedImages}
                      onDeleteImage={handleDeleteImage}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-[50px]  flex items-start justify-center">
                <div>
                  {/* Thread 内容 */}
                  {rawAPIData && (
                    <MarkdownRenderer
                      content={rawAPIData}
                      onSectionHover={handleMarkdownHover}
                      onSourceClick={handleSourceClick}
                      onImageClick={handleImageClick}
                      onTweetImageEdit={handleTweetImageEdit}
                      onTweetContentChange={handleTweetContentChange}
                      onGroupTitleChange={handleGroupTitleChange}
                      onLocalImageUploadSuccess={handleLocalImageUpload}
                      onImageSelect={handleImageSelect} // 新增
                      onDirectGenerate={handleDirectGenerate}
                      onEditWithAI={handleEditWithAI}
                      highlightedSection={hoveredTweetId}
                      hoveredTweetId={hoveredTweetId}
                      selectedNodeId={selectedNodeId}
                      editingNodeId={selectedNodeForAI}
                      imageData={generatedContent?.image}
                      tweetData={rawAPIData}
                      loadingTweetId={loadingTweetId}
                      generatingImageTweetIds={generatingImageTweetIds}
                      localImageUrls={localImageUrls} // 新增
                      scrollToSection={scrollToSection}
                      collectedImages={collectedImages}
                      onDeleteImage={handleDeleteImage}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI 编辑对话框 - 固定在右侧 */}
      {showAIEditModal && (
        <div className="fixed inset-y-0 right-0 z-50 w-1/2">
          <div className="flex h-full items-end ">
            <div className="flex w-full flex-col bg-[#F5F6F7] p-[20px] ">
              <div className="mb-[24px]">
                <h3 className="text-xl font-semibold">
                  How would you like to enhance this part?
                </h3>
              </div>
              <div className="flex-1">
                <textarea
                  value={aiEditInstruction}
                  onChange={(e) => setAiEditInstruction(e.target.value)}
                  placeholder="Please limit to 300 words."
                  maxLength={300}
                  className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                  rows={8}
                  autoFocus
                />
                <div className="mt-[12px] flex justify-end gap-3">
                  <Button
                    variant="flat"
                    onPress={() => {
                      setShowAIEditModal(false);
                      setAiEditInstruction('');
                      setSelectedNodeForAI(null);
                    }}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleAIEditSubmit}
                    isLoading={isAIProcessing}
                    disabled={!aiEditInstruction.trim()}
                    className="bg-[#4285F4] px-6 text-white hover:bg-[#3367D6]"
                  >
                    {isAIProcessing ? 'Generating...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片编辑模态框 */}
      {isImageEditModalOpen && editingImage && rawAPIData && (
        <ImageEditModal
          image={editingImage}
          targetTweet={editingTweetData?.content || ''}
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
            clearGeneratingImageTweetIds(); // 清除生图高亮状态
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteImage}
        isLoading={isDeletingImage}
      />
    </div>
  );
}
