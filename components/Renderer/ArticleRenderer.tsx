'use client';

import { Image } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';

import { useAIEditing } from '@/hooks/useAIEditing';
import { useContentManagement } from '@/hooks/useContentManagement';
import { useGenerationState } from '@/hooks/useGenerationState';
import { useImageManagement } from '@/hooks/useImageManagement';
import { useMindmapInteraction } from '@/hooks/useMindmapInteraction';
import { useTwitterIntegration } from '@/hooks/useTwitterIntegration';
import { convertThreadDataToMindmap } from '@/lib/data/converters';
import { useAuthStore } from '@/stores/authStore';
import { IContentFormat, IMode } from '@/types/api';
import { MindmapEdgeData, MindmapNodeData } from '@/types/content';
import { IOutline } from '@/types/outline';
import { isLongformType } from '@/utils/contentFormat';

import { AIEditDialog } from './ArticleRenderer/AIEditDialog';
import { ArticleToolbar } from './ArticleRenderer/ArticleToolbar';
import { DeleteConfirmModal } from './ArticleRenderer/DeleteConfirmModal';
import { CreateArticleLoading } from './CreateLoading';
import { ImageEditModal } from './markdown/ImageEditModal';
import { MarkdownRenderer } from './markdown/MarkdownRenderer';
import EditableContentMindmap from './mindmap/MindmapRenderer';
import FreeConversation from './sseChat/FreeConversation';

interface ArticleRendererProps {
  topic: string;
  contentFormat: IContentFormat;
  mode?: IMode; // 添加mode属性
  userInput?: string; // 添加userInput属性
  onBack: () => void;
  initialData?: IOutline;
  onDataUpdate?: () => void;
  sessionId?: string;
  onGenerationComplete?: (data: IOutline) => void; // 添加生成完成回调
  onGenerationError?: (error: Error) => void; // 添加错误回调
  isOnboarding?: boolean;
  isTooltipOpenNum?: number;
}

export function ArticleRenderer({
  topic,
  contentFormat,
  mode,
  userInput,
  onBack,
  initialData,
  onDataUpdate,
  sessionId,
  onGenerationComplete,
  onGenerationError,
  isOnboarding = false,
  isTooltipOpenNum = 0,
}: ArticleRendererProps) {
  // 状态：思维导图节点和边
  const [currentNodes, setCurrentNodes] = useState<MindmapNodeData[]>([]);
  const [currentEdges, setCurrentEdges] = useState<MindmapEdgeData[]>([]);

  // 获取用户信息
  const { user } = useAuthStore();

  // 使用自定义 Hooks - 传入mode和userInput
  const generation = useGenerationState({
    mode,
    topic,
    contentFormat,
    initialData,
    sessionId,
    userInput,
    onGenerationComplete: useCallback(
      (data: IOutline) => {
        console.log('Generation completed:', data);
        const { nodes, edges } = convertThreadDataToMindmap(data);
        setCurrentNodes(nodes);
        setCurrentEdges(edges);
        onGenerationComplete?.(data);
      },
      [onGenerationComplete],
    ),
    onGenerationError: useCallback(
      (error: Error) => {
        console.error('Generation error:', error);
        onGenerationError?.(error);
        onBack();
      },
      [onBack, onGenerationError],
    ),
  });

  // 对于非 draft 模式，组件挂载后立即开始生成
  useEffect(() => {
    if (!initialData && mode && topic && !generation.hasStartedGeneration) {
      console.log('Starting generation for mode:', mode);
      generation.startGeneration({
        topic,
        contentFormat,
        mode,
        userInput,
        sessionId,
      });
    }
  }, [
    mode,
    topic,
    contentFormat,
    userInput,
    sessionId,
    initialData,
    generation.hasStartedGeneration,
    generation,
  ]);

  const images = useImageManagement({
    rawAPIData: generation.rawAPIData,
    contentFormat,
    onDataUpdate,
    onContentUpdate: useCallback(
      (updatedData: IOutline) => {
        generation.setRawAPIData(updatedData);
      },
      [generation],
    ),
  });

  const twitter = useTwitterIntegration({
    rawAPIData: generation.rawAPIData,
    collectedImages: images.collectedImages,
  });

  const aiEdit = useAIEditing({
    rawAPIData: generation.rawAPIData,
    currentNodes,
    onDataUpdate,
    onContentUpdate: useCallback(
      (updatedData: IOutline) => {
        generation.setRawAPIData(updatedData);
        const { nodes, edges } = convertThreadDataToMindmap(updatedData);
        setCurrentNodes(nodes);
        setCurrentEdges(edges);
      },
      [generation],
    ),
  });

  const content = useContentManagement({
    rawAPIData: generation.rawAPIData,
    currentNodes,
    currentEdges,
    generatedContent: generation.generatedContent,
    onDataUpdate,
    onContentUpdate: useCallback(
      (updatedData: IOutline) => {
        generation.setRawAPIData(updatedData);
      },
      [generation],
    ),
    onNodesUpdate: useCallback(
      (nodes: MindmapNodeData[], edges: MindmapEdgeData[]) => {
        setCurrentNodes(nodes);
        setCurrentEdges(edges);
      },
      [],
    ),
  });

  const mindmap = useMindmapInteraction({
    currentNodes,
    currentEdges,
    onNodesUpdate: setCurrentNodes,
    onEdgesUpdate: setCurrentEdges,
  });

  // 初始化思维导图数据
  useEffect(() => {
    if (generation.rawAPIData) {
      const { nodes, edges } = convertThreadDataToMindmap(
        generation.rawAPIData,
      );
      setCurrentNodes(nodes);
      setCurrentEdges(edges);
    }
  }, [generation.rawAPIData]);

  // 格式化时间
  const formatTime = useCallback((date: number | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // 右侧 Markdown 区域滚动容器，用于在长推模式下滚动到底部图片画廊
  const markdownScrollRef = useRef<HTMLDivElement | null>(null);
  const imageGalleryElRef = useRef<HTMLDivElement | null>(null);
  const imageItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerImageGalleryRef = useCallback((el: HTMLDivElement | null) => {
    imageGalleryElRef.current = el;
  }, []);

  const registerImageItemRef = useCallback(
    (tweetId: string, el: HTMLDivElement | null) => {
      if (el) {
        imageItemRefs.current.set(tweetId, el);
      } else {
        imageItemRefs.current.delete(tweetId);
      }
    },
    [],
  );

  const scrollToImageGallery = useCallback(
    (targetTweetId?: string, delay: number = 100) => {
      // 添加延迟，确保 DOM 更新完成
      setTimeout(() => {
        const scrollContainer = markdownScrollRef.current;
        if (!scrollContainer) return;

        // 如果有特定的 tweetId，尝试滚动到对应图片
        if (targetTweetId) {
          const targetImageEl = imageItemRefs.current.get(targetTweetId);
          if (targetImageEl) {
            try {
              const imageRect = targetImageEl.getBoundingClientRect();
              const containerRect = scrollContainer.getBoundingClientRect();
              const relativeTop =
                imageRect.top - containerRect.top + scrollContainer.scrollTop;

              // 滚动到图片位置，使其居中显示
              const offset = (containerRect.height - imageRect.height) / 2;
              scrollContainer.scrollTo({
                top: relativeTop - offset,
                behavior: 'smooth',
              });
              return;
            } catch (e) {
              console.error('Scroll to specific image failed:', e);
            }
          }
        }

        // Fallback: 滚动到画廊顶部
        const galleryEl = imageGalleryElRef.current;
        if (galleryEl) {
          try {
            const galleryRect = galleryEl.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const relativeTop =
              galleryRect.top - containerRect.top + scrollContainer.scrollTop;

            scrollContainer.scrollTo({
              top: relativeTop - 100, // 留出100px的空间
              behavior: 'smooth',
            });
            return;
          } catch (e) {
            console.error('Scroll to gallery failed:', e);
          }
        }

        // Final fallback: 滚动到底部
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      }, delay);
    },
    [],
  );

  // 记录上一次的 generatingImageTweetIds，用于检测新增的 tweetId
  const prevGeneratingImageTweetIdsRef = useRef<string[]>([]);
  const prevCollectedImagesRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);

  // 标记初始化完成
  useEffect(() => {
    // 使用 setTimeout 确保在初始渲染后才标记为已初始化
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 监听 generatingImageTweetIds 的变化，在新增图片时进行滚动
  useEffect(() => {
    if (isLongformType(contentFormat) && images.generatingImageTweetIds) {
      const prevIds = prevGeneratingImageTweetIdsRef.current;
      const currentIds = images.generatingImageTweetIds;

      // 找出新增的 tweetId
      const newIds = currentIds.filter((id) => !prevIds.includes(id));

      // 只在初始化完成后且有新增时才滚动
      if (isInitializedRef.current && newIds.length > 0) {
        // 滚动到最后一个新增的图片
        const targetId = newIds[newIds.length - 1];
        scrollToImageGallery(targetId, 300); // 增加延迟，确保 DOM 更新
      }

      // 更新记录
      prevGeneratingImageTweetIdsRef.current = currentIds;
    }
  }, [contentFormat, images.generatingImageTweetIds, scrollToImageGallery]);

  // 监听 collectedImages 的变化，在本地上传图片时进行滚动
  useEffect(() => {
    if (isLongformType(contentFormat) && images.collectedImages) {
      const prevImages = prevCollectedImagesRef.current;
      const currentImages = images.collectedImages;

      // 检查是否有新增的图片（通过长度变化）
      if (
        currentImages.length > prevImages.length &&
        isInitializedRef.current
      ) {
        // 找出新增的图片
        const newImages = currentImages.slice(prevImages.length);
        if (newImages.length > 0) {
          const lastNewImage = newImages[newImages.length - 1];
          if (lastNewImage.tweetId) {
            // 滚动到新增的图片
            scrollToImageGallery(lastNewImage.tweetId, 300);
          }
        }
      }

      // 更新记录
      prevCollectedImagesRef.current = currentImages;
    }
  }, [contentFormat, images.collectedImages, scrollToImageGallery]);

  // 将图片生成/编辑事件包装为执行原逻辑（滚动由 useEffect 自动处理）
  const handleTweetImageEditAndScroll = useCallback(
    (tweetData: any) => {
      images.handleTweetImageEdit(tweetData);
    },
    [images.handleTweetImageEdit],
  );

  const handleDirectGenerateAndScroll = useCallback(
    (tweetData: any) => {
      images.handleDirectGenerate(tweetData);
    },
    [images.handleDirectGenerate],
  );

  const handleLocalImageUploadAndScroll = useCallback(
    (result: { url: string; alt: string }, tweetData: any) => {
      images.handleLocalImageUpload(result, tweetData);
    },
    [images.handleLocalImageUpload],
  );

  const handleImageSelectAndScroll = useCallback(
    (result: { localUrl: string; file: File }, tweetData: any) => {
      images.handleImageSelect(result, tweetData);
    },
    [images.handleImageSelect],
  );

  // 如果正在生成或出错，显示加载页面
  if (
    generation.isGenerating ||
    (!generation.generatedContent && !generation.rawAPIData && !initialData)
  ) {
    const hasError = !generation.isGenerating && !!generation.apiError;

    return (
      <CreateArticleLoading
        topic={topic}
        onBack={onBack}
        isError={hasError}
        errorMessage={generation.apiError || undefined}
        generationSteps={generation.generationSteps}
        onRetry={
          hasError
            ? () => {
                generation.resetGeneration();
                generation.startGeneration();
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <ArticleToolbar
        topic={topic}
        contentFormat={contentFormat}
        isGenerating={generation.isGenerating}
        isRegenerating={content.isRegenerating}
        isPostingToTwitter={twitter.isPostingToTwitter}
        isCopyingFullContent={twitter.isCopyingFullContent}
        hasTwitterAuth={twitter.checkTwitterAuth()}
        onBack={onBack}
        onRegenerate={content.handleRegenerateClick}
        onCopyFullContent={twitter.handleCopyFullContent}
        onPostToTwitter={twitter.handlePostToTwitter}
      />

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden bg-[#F7F7F7]">
        {/* 左侧思维导图 */}
        <div className="mindmap-container relative mb-3 ml-3 mr-1.5 flex-1 overflow-hidden rounded-[20px] bg-[#fcfcfc]">
          <ReactFlowProvider>
            <EditableContentMindmap
              nodes={currentNodes}
              edges={currentEdges}
              originalOutline={generation.rawAPIData || undefined}
              user={user}
              onNodeSelect={mindmap.handleNodeSelect}
              onNodeHover={mindmap.handleNodeHover}
              onNodesChange={mindmap.handleNodesChange}
              onEdgesChange={mindmap.handleEdgesChange}
              onRegenerateClick={content.handleRegenerateClick}
              highlightedNodeId={mindmap.selectedNodeId}
              hoveredTweetId={mindmap.selectedNodeId}
              isRegenerating={content.isRegenerating}
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧内容区域 */}
        <div className="article-content mb-3 ml-1.5 mr-3 flex min-w-0 flex-1 justify-center rounded-[20px] bg-white">
          <div
            ref={markdownScrollRef}
            className="font-inter mx-auto flex w-[628px] min-w-0 flex-col overflow-y-auto overflow-x-hidden break-words px-[24px] pb-[60px]"
            //保证与正式环境尺寸一致
            style={{
              width: '628px',
            }}
          >
            {/* 标题区域 */}
            <div className="pt-[40px]">
              <h1 className="font-inter break-words text-[32px] font-[700] leading-none text-black">
                {generation.rawAPIData?.topic}
              </h1>
              <p className="font-inter mt-[10px] text-[14px] font-[400] leading-none text-[#8C8C8C]">
                {formatTime(generation.rawAPIData?.updatedAt || Date.now())}
              </p>
            </div>

            {/* Twitter Thread内容区域 */}
            {isLongformType(contentFormat) ? (
              <div className="mt-[50px] flex min-w-0 items-start justify-center">
                <div className="size-[40px] shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={user?.avatar}
                    width={40}
                    height={40}
                    alt={user?.name}
                    className="overflow-hidden rounded-full object-cover"
                  />
                </div>

                <div className="min-w-0 break-words">
                  <div className="ml-[12px] flex gap-[4px] pb-[12px] text-[16px] leading-none">
                    <span className="font-[600] text-black">{user?.name}</span>
                    {user?.account_name && (
                      <span className="text-[#5C6D7A]">
                        @{user?.account_name}
                      </span>
                    )}
                  </div>
                  {/* Thread 内容 */}
                  {generation.rawAPIData && (
                    <MarkdownRenderer
                      content={generation.rawAPIData}
                      tweetData={generation.rawAPIData}
                      onSectionHover={mindmap.handleMarkdownHover}
                      onSourceClick={() => {}} // TODO: 实现信息来源展示功能
                      onImageClick={images.handleImageClick}
                      onTweetImageEdit={handleTweetImageEditAndScroll}
                      onTweetContentChange={content.handleTweetContentChange}
                      onGroupTitleChange={content.handleGroupTitleChange}
                      onLocalImageUploadSuccess={
                        handleLocalImageUploadAndScroll
                      }
                      onImageSelect={handleImageSelectAndScroll}
                      onDirectGenerate={handleDirectGenerateAndScroll}
                      onEditWithAI={aiEdit.handleEditWithAI}
                      highlightedSection={mindmap.hoveredTweetId}
                      hoveredTweetId={mindmap.hoveredTweetId}
                      selectedNodeId={mindmap.selectedNodeId}
                      editingNodeId={aiEdit.selectedNodeForAI}
                      imageData={generation.generatedContent?.image}
                      loadingTweetId={content.loadingTweetId}
                      generatingImageTweetIds={images.generatingImageTweetIds}
                      localImageUrls={images.localImageUrls}
                      scrollToSection={mindmap.scrollToSection}
                      collectedImages={images.collectedImages}
                      onDeleteImage={images.handleDeleteImage}
                      isOnboarding={isOnboarding}
                      isTooltipOpenNum={isTooltipOpenNum}
                      onImageGalleryRef={registerImageGalleryRef}
                      onImageItemRef={registerImageItemRef}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-[50px] flex min-w-0 items-start justify-center">
                <div className="min-w-0 break-words">
                  {/* Thread 内容 */}
                  {generation.rawAPIData && (
                    <MarkdownRenderer
                      content={generation.rawAPIData}
                      onSectionHover={mindmap.handleMarkdownHover}
                      onSourceClick={() => {}} // TODO: 实现信息来源展示功能
                      onImageClick={images.handleImageClick}
                      onTweetImageEdit={images.handleTweetImageEdit}
                      onTweetContentChange={content.handleTweetContentChange}
                      onGroupTitleChange={content.handleGroupTitleChange}
                      onLocalImageUploadSuccess={images.handleLocalImageUpload}
                      onImageSelect={images.handleImageSelect}
                      onDirectGenerate={images.handleDirectGenerate}
                      onEditWithAI={aiEdit.handleEditWithAI}
                      highlightedSection={mindmap.hoveredTweetId}
                      hoveredTweetId={mindmap.hoveredTweetId}
                      selectedNodeId={mindmap.selectedNodeId}
                      editingNodeId={aiEdit.selectedNodeForAI}
                      imageData={generation.generatedContent?.image}
                      tweetData={generation.rawAPIData}
                      loadingTweetId={content.loadingTweetId}
                      generatingImageTweetIds={images.generatingImageTweetIds}
                      localImageUrls={images.localImageUrls}
                      scrollToSection={mindmap.scrollToSection}
                      collectedImages={images.collectedImages}
                      onDeleteImage={images.handleDeleteImage}
                      isOnboarding={isOnboarding}
                      isTooltipOpenNum={isTooltipOpenNum}
                      onImageGalleryRef={registerImageGalleryRef}
                      onImageItemRef={registerImageItemRef}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI 自由对话功能 */}
      <FreeConversation
        docId={sessionId || generation.rawAPIData?.id || 'default'}
        documentContext={generation.rawAPIData || undefined}
        onContentUpdate={(updatedData) => {
          generation.setRawAPIData(updatedData);
          const { nodes, edges } = convertThreadDataToMindmap(updatedData);
          setCurrentNodes(nodes);
          setCurrentEdges(edges);
        }}
        onDataUpdate={onDataUpdate}
      />

      {/* AI 编辑对话框 */}
      <AIEditDialog
        isOpen={aiEdit.showAIEditModal}
        instruction={aiEdit.aiEditInstruction}
        isProcessing={aiEdit.isAIProcessing}
        onInstructionChange={aiEdit.setAiEditInstruction}
        onSubmit={aiEdit.handleAIEditSubmit}
        onClose={aiEdit.closeAIEditModal}
      />

      {/* 图片编辑模态框 */}
      {images.isImageEditModalOpen &&
        images.editingImage &&
        generation.rawAPIData && (
          <ImageEditModal
            image={images.editingImage}
            targetTweet={images.editingTweetData?.content || ''}
            tweetThread={generation.rawAPIData.nodes
              .flatMap((group: any) => group.tweets)
              .map(
                (tweet: any, index: number) =>
                  `(${index + 1}) ${tweet.content || tweet.title}`,
              )
              .join(' \n')}
            onImageUpdate={images.handleImageUpdate}
            onClose={() => {
              images.setIsImageEditModalOpen(false);
              images.setEditingImage(null);
              images.setEditingTweetData(null);
              images.clearGeneratingImageTweetIds();
            }}
          />
        )}

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={images.isDeleteModalOpen}
        onClose={() => images.setIsDeleteModalOpen(false)}
        onConfirm={images.confirmDeleteImage}
        isLoading={images.isDeletingImage}
        itemName="this image"
      />
    </div>
  );
}
