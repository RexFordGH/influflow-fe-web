'use client';

import { Button, cn, Image } from '@heroui/react';
import { CopyIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Outline } from '@/types/outline';
import { devLog } from '@/utils/devLog';
import {
  MarkdownSection,
  processSectionsFromOutline,
  validateOutlineData,
} from '@/utils/markdownUtils';
import { copyImageToClipboard } from '@/utils/twitter';

import { markdownStyles } from './markdownStyles';
import { SectionRenderer } from './SectionRenderer';
import { SectionRendererOfLongForm } from './SectionRendererOfLongForm';

interface MarkdownRendererProps {
  content: Outline;
  onSectionHover?: (sectionId: string | null) => void;
  onSourceClick?: (sectionId: string) => void;
  onImageClick?: (image: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  }) => void;
  onTweetImageEdit?: (tweetData: any) => void; // 新增：tweet图片编辑回调
  onTweetContentChange?: (tweetId: string, newContent: string) => void;
  onGroupTitleChange?: (groupId: string, newTitle: string) => void; // 新增：group标题编辑回调
  onLocalImageUploadSuccess: (
    result: { url: string; alt: string },
    tweetData: any,
  ) => void; // 新增回调
  onImageSelect?: (
    result: { localUrl: string; file: File },
    tweetData: any,
  ) => void; // 新增：图片选择回调
  onDirectGenerate?: (tweetData: any) => void; // 新增：直接生图回调
  onEditWithAI?: (nodeId: string) => void; // 新增：Edit with AI 回调
  highlightedSection?: string | null;
  hoveredTweetId?: string | null; // 新增：从思维导图hover传递的tweetId
  selectedNodeId?: string | null; // 新增：从思维导图选中传递的NodeId
  editingNodeId?: string | null; // 新增：正在编辑的节点ID
  loadingTweetId?: string | null; // 新增：loading状态的tweetId
  generatingImageTweetIds?: string[]; // 新增：正在生图的tweetId数组
  localImageUrls?: Record<string, string>; // 新增：本地图片预览URL
  imageData?: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  tweetData?: any; // 新增：tweet数据，用于获取image_url
  scrollToSection?: string | null; // 新增：滚动到指定section的ID
  collectedImages?: any[]; // 新增：收集到的图片
  onDeleteImage?: (image: any) => void; // 新增：删除图片回调
}

interface CollectedImage {
  src: string;
  alt: string;
  originalSectionId: string;
  tweetId?: string;
}

export function MarkdownRenderer({
  content,
  onSectionHover,
  onSourceClick,
  onImageClick,
  onTweetImageEdit,
  onTweetContentChange,
  onGroupTitleChange,
  onLocalImageUploadSuccess,
  onImageSelect,
  onDirectGenerate,
  onEditWithAI,
  highlightedSection,
  hoveredTweetId,
  selectedNodeId,
  editingNodeId,
  loadingTweetId,
  generatingImageTweetIds,
  localImageUrls,
  imageData,
  tweetData,
  scrollToSection,
  collectedImages = [],
  onDeleteImage,
}: MarkdownRendererProps) {
  const [copyingImage, setCopyingImage] = useState<string | null>(null);

  // 创建section ref的映射
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 设置section ref的回调函数
  const setSectionRef = useCallback(
    (sectionId: string, element: HTMLDivElement | null) => {
      if (element) {
        sectionRefs.current.set(sectionId, element);
      } else {
        sectionRefs.current.delete(sectionId);
      }
    },
    [],
  );

  // 滚动到指定section的函数
  const scrollToSectionById = useCallback((sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  // 验证输入数据
  if (!validateOutlineData(content)) {
    throw new TypeError('MarkdownRenderer only accepts Outline data format');
  }

  // 直接从 Outline 数据生成 sections
  const sections = useMemo(() => {
    return processSectionsFromOutline(content, {
      contentFormat: content.content_format,
    });
  }, [content]);

  useEffect(() => {
    if (content) {
      devLog('MarkdownRenderer->outline', {
        outline: content,
      });
    }
  }, [content]);

  useEffect(() => {
    if (sections && sections.length > 0) {
      devLog('MarkdownRenderer->sections', sections);
    }
  }, [sections]);

  // 监听scrollToSection变化并执行滚动
  useEffect(() => {
    if (scrollToSection) {
      // 查找匹配的section ID
      const matchingSectionId = sections.find((section) => {
        // 支持多种匹配方式
        return (
          section.id === scrollToSection ||
          section.mappingId === scrollToSection ||
          section.tweetId === scrollToSection ||
          section.groupId === scrollToSection ||
          (scrollToSection.startsWith('group-') &&
            section.groupId === scrollToSection.replace('group-', '')) ||
          (section.tweetId &&
            section.tweetId.toString() === scrollToSection.toString()) ||
          (section.groupId &&
            section.groupId.toString() === scrollToSection.toString())
        );
      })?.id;

      if (matchingSectionId) {
        // 添加小延迟确保DOM已更新
        setTimeout(() => scrollToSectionById(matchingSectionId), 100);
      }
    }
  }, [scrollToSection, sections, scrollToSectionById]);

  // 检查section是否匹配指定的ID
  const checkSectionMatch = (
    section: MarkdownSection,
    targetId: string | null | undefined,
  ): boolean => {
    if (!targetId) return false;

    // 直接ID匹配
    if (section.id === targetId || section.mappingId === targetId) return true;

    // 处理group ID匹配
    if (targetId.startsWith('group-') && section.groupId) {
      const groupId = targetId.replace('group-', '');
      return matchIds(section.groupId, groupId);
    }

    // 处理tweet ID匹配
    if (
      section.tweetId &&
      (section.type === 'tweet' || section.type === 'tweetTitle')
    ) {
      return matchIds(section.tweetId, targetId);
    }

    return false;
  };

  // ID匹配辅助函数
  const matchIds = (id1: any, id2: any): boolean => {
    if (!id1 || !id2) return false;
    return (
      id1 === id2 ||
      id1.toString() === id2.toString() ||
      Number(id1) === Number(id2)
    );
  };

  // 渲染单个段落
  const renderSection = (section: MarkdownSection) => {
    // 检查是否应该高亮
    const isHighlighted =
      checkSectionMatch(section, highlightedSection) ||
      checkSectionMatch(section, hoveredTweetId) ||
      checkSectionMatch(section, editingNodeId) ||
      checkSectionMatch(section, selectedNodeId) ||
      (generatingImageTweetIds?.some((id) => checkSectionMatch(section, id)) ??
        false);

    // 检查是否正在loading
    const isLoading = checkSectionMatch(section, loadingTweetId);

    // 根据 content_format 选择渲染器
    const RendererSectionComponent =
      tweetData?.content_format === 'longform'
        ? SectionRendererOfLongForm
        : SectionRenderer;

    return (
      <RendererSectionComponent
        key={section.id}
        section={section}
        isHighlighted={isHighlighted}
        isLoading={isLoading}
        onSectionHover={onSectionHover}
        onImageClick={onImageClick}
        onTweetImageEdit={onTweetImageEdit}
        onTweetContentChange={onTweetContentChange}
        onGroupTitleChange={onGroupTitleChange}
        onLocalImageUploadSuccess={onLocalImageUploadSuccess}
        onImageSelect={onImageSelect}
        onDirectGenerate={onDirectGenerate}
        onEditWithAI={onEditWithAI}
        editingNodeId={editingNodeId}
        generatingImageTweetIds={generatingImageTweetIds}
        localImageUrls={localImageUrls}
        tweetData={tweetData}
        imageData={imageData}
        setSectionRef={setSectionRef}
        onDeleteImage={onDeleteImage}
      />
    );
  };

  return (
    <div
      className={cn(
        markdownStyles.container.main,
        editingNodeId ? 'pb-[300px]' : '',
      )}
    >
      <div className={markdownStyles.container.content}>
        <div className={markdownStyles.container.sections}>
          {sections.map((section) => renderSection(section))}
        </div>

        {/* 图片画廊 - 仅在 longform 模式下显示 */}
        {tweetData?.content_format === 'longform' &&
          collectedImages.length > 0 && (
            <div className="mt-[48px] flex w-[580px]  flex-col justify-center gap-[16px] overflow-hidden">
              {collectedImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative flex aspect-video h-[400px] justify-center"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    className="h-[400px] w-auto max-w-[500px] rounded-lg object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute right-1.5 top-1.5 z-20 flex items-center justify-end gap-1">
                    <Button
                      isIconOnly
                      isLoading={copyingImage === image.src}
                      disabled={!!copyingImage}
                      onPress={async () => {
                        setCopyingImage(image.src);
                        await copyImageToClipboard(image.src);
                        setCopyingImage(null);
                      }}
                      className="hidden items-center justify-center rounded-full bg-black/60 p-1 text-white opacity-80 transition-all hover:bg-blue-500 hover:opacity-100 group-hover:flex"
                      aria-label="Copy image"
                    >
                      <CopyIcon size={16} weight="bold" />
                    </Button>
                    <Button
                      isIconOnly
                      onPress={() => {
                        onDeleteImage?.(image);
                      }}
                      className="hidden items-center justify-center rounded-full bg-black/60 p-1 text-white opacity-80 transition-all hover:bg-red-500 hover:opacity-100 group-hover:flex"
                      aria-label="Delete image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
