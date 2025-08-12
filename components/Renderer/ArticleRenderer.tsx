'use client';

import { Image } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
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

import { AIEditDialog } from './ArticleRenderer/AIEditDialog';
import { ArticleToolbar } from './ArticleRenderer/ArticleToolbar';
import { DeleteConfirmModal } from './ArticleRenderer/DeleteConfirmModal';
import { CreateArticleLoading } from './CreateLoading';
import { ImageEditModal } from './markdown/ImageEditModal';
import { MarkdownRenderer } from './markdown/MarkdownRenderer';
import EditableContentMindmap from './mindmap/MindmapRenderer';

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
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧思维导图 */}
        <div className="relative flex-1 border-r border-gray-200 bg-white">
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
              hoveredTweetId={mindmap.hoveredTweetId}
              isRegenerating={content.isRegenerating}
            />
          </ReactFlowProvider>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex flex-1 justify-center bg-white">
          <div className="font-inter mx-auto flex w-[628px] flex-col overflow-scroll px-[24px] pb-[60px]">
            {/* 标题区域 */}
            <div className="pt-[24px]">
              <h1 className="font-inter text-[32px] font-[700] leading-none text-black">
                {generation.rawAPIData?.topic}
              </h1>
              <p className="font-inter mt-[10px] text-[14px] font-[400] leading-none text-[#8C8C8C]">
                {formatTime(generation.rawAPIData?.updatedAt || Date.now())}
              </p>
            </div>

            {/* Twitter Thread内容区域 */}
            {contentFormat === 'longform' ? (
              <div className="mt-[50px] flex items-start justify-center">
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
                      loadingTweetId={content.loadingTweetId}
                      generatingImageTweetIds={images.generatingImageTweetIds}
                      localImageUrls={images.localImageUrls}
                      scrollToSection={mindmap.scrollToSection}
                      collectedImages={images.collectedImages}
                      onDeleteImage={images.handleDeleteImage}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-[50px] flex items-start justify-center">
                <div>
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
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
