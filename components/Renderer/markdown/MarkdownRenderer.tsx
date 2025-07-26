'use client';

import { Button, cn, Image } from '@heroui/react';
import { CopyIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { copyImageToClipboard } from '@/utils/twitter';

import { devLog } from '@/utils/devLog';
import { markdownStyles } from './markdownStyles';
import { SectionRenderer } from './SectionRenderer';
import { SectionRendererOfLongForm } from './SectionRendererOfLongForm';

interface MarkdownRendererProps {
  content: string;
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

interface MarkdownSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'tweet' | 'group';
  level?: number;
  content: string;
  rawContent: string;
  mappingId?: string; // 用于与思维导图节点映射
  tweetId?: string; // 用于tweet高亮
  groupIndex?: number;
  tweetIndex?: number;
  groupId?: string; // 用于group高亮
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

  // 处理图片占位符 - 只有真实的图片URL才会被替换
  const processedContent = useMemo(() => {
    if (imageData?.url) {
      return content.replace('PLACEHOLDER_IMAGE', imageData.url);
    }
    // 如果没有真实图片，移除占位符
    return content.replace('PLACEHOLDER_IMAGE', '');
  }, [content, imageData]);

  // 解析含有HTML标签的Markdown为结构化数据
  const sections = useMemo(() => {
    const lines = processedContent.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    let sectionIndex = 0;
    let inTweetDiv = false;
    let inGroupDiv = false;
    let currentTweetId: string | null = null;
    let currentGroupIndex: number | null = null;
    let currentTweetIndex: number | null = null;
    let currentGroupId: string | null = null;
    let groupCounter = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // 检查是否是时间标签 div
      const timeDivMatch = trimmedLine.match(
        /<div\s+class="[^"]*">Edited on [^<]+<\/div>/,
      );
      if (timeDivMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `time-section-${sectionIndex++}`,
          type: 'paragraph',
          content: trimmedLine, // 保存完整的 HTML
          rawContent: line,
        };
        sections.push(currentSection);
        currentSection = null;
        return;
      }

      // 检查是否是group div开始标签
      const groupDivMatch = trimmedLine.match(/<div\s+data-group-id="(\d+)">/);
      if (groupDivMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        inGroupDiv = true;
        currentGroupId = groupDivMatch[1];

        currentSection = {
          id: `group-section-${currentGroupId}`,
          type: 'group',
          content: '',
          rawContent: line,
          groupId: currentGroupId,
          groupIndex: groupCounter++,
        };
        return;
      }

      // 检查是否是tweet div开始标签
      const tweetDivMatch = trimmedLine.match(
        /<div\s+data-tweet-id="(\d+)"\s+data-group-index="(\d+)"\s+data-tweet-index="(\d+)">/,
      );
      if (tweetDivMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        inTweetDiv = true;
        currentTweetId = tweetDivMatch[1];
        currentGroupIndex = parseInt(tweetDivMatch[2]);
        currentTweetIndex = parseInt(tweetDivMatch[3]);

        currentSection = {
          id: `tweet-section-${currentTweetId}`,
          type: 'tweet',
          content: '',
          rawContent: line,
          tweetId: currentTweetId,
          groupIndex: currentGroupIndex,
          tweetIndex: currentTweetIndex,
        };
        return;
      }

      // 检查是否是div结束标签
      if (trimmedLine === '</div>') {
        if (inTweetDiv) {
          if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
          }
          inTweetDiv = false;
          currentTweetId = null;
          currentGroupIndex = null;
          currentTweetIndex = null;
          return;
        } else if (inGroupDiv) {
          if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
          }
          inGroupDiv = false;
          currentGroupId = null;
          return;
        }
      }

      // 如果在div内，累积内容，特别处理标题
      if (inTweetDiv && currentSection) {
        if (trimmedLine && !trimmedLine.startsWith('---')) {
          // 检查是否是标题行
          if (trimmedLine.startsWith('#')) {
            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            const text = trimmedLine
              .replace(/^#+\s*/, '')
              .replace(/[🧵📊💡🔧🚀✨]/gu, '')
              .trim();

            // 如果还没有内容，将标题作为主要内容
            if (!currentSection.content) {
              currentSection.content = text;
              currentSection.type = 'tweet'; // 确保类型正确
              currentSection.level = level;
            } else {
              // 如果已有内容，添加到现有内容
              currentSection.content += '\n\n' + text;
            }
          } else {
            // 普通内容行
            if (currentSection.content) {
              currentSection.content += '\n\n' + trimmedLine;
            } else {
              currentSection.content = trimmedLine;
            }
          }
          currentSection.rawContent += '\n' + line;
        }
        return;
      }

      if (inGroupDiv && currentSection) {
        if (trimmedLine && !trimmedLine.startsWith('---')) {
          // 检查是否是标题行
          if (trimmedLine.startsWith('#')) {
            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            const text = trimmedLine
              .replace(/^#+\s*/, '')
              .replace(/[🧵📊💡🔧🚀✨]/gu, '')
              .trim();

            // 如果还没有内容，将标题作为主要内容
            if (!currentSection.content) {
              currentSection.content = text;
              currentSection.type = 'group'; // 确保类型正确
              currentSection.level = level;
            } else {
              // 如果已有内容，添加到现有内容
              currentSection.content += '\n\n' + text;
            }
          } else {
            // 普通内容行
            if (currentSection.content) {
              currentSection.content += '\n\n' + trimmedLine;
            } else {
              currentSection.content = trimmedLine;
            }
          }
          currentSection.rawContent += '\n' + line;
        }
        return;
      }

      // 普通markdown解析逻辑
      if (trimmedLine.startsWith('#')) {
        // 标题
        if (currentSection) {
          sections.push(currentSection);
        }

        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const text = trimmedLine
          .replace(/^#+\s*/, '')
          .replace(/[🧵📊💡🔧🚀✨]/gu, '')
          .trim();

        currentSection = {
          id: `section-${sectionIndex++}`,
          type: 'heading',
          level,
          content: text,
          rawContent: line,
        };
      } else if (
        trimmedLine.startsWith('-') ||
        trimmedLine.startsWith('*') ||
        /^\d+\./.test(trimmedLine)
      ) {
        // 列表项
        if (!currentSection || currentSection.type !== 'list') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: `section-${sectionIndex++}`,
            type: 'list',
            content: trimmedLine,
            rawContent: line,
          };
        } else {
          currentSection.content += '\n' + trimmedLine;
          currentSection.rawContent += '\n' + line;
        }
      } else if (trimmedLine && !trimmedLine.startsWith('---')) {
        // 段落（排除分隔线）
        if (!currentSection || currentSection.type !== 'paragraph') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: `section-${sectionIndex++}`,
            type: 'paragraph',
            content: trimmedLine,
            rawContent: line,
          };
        } else {
          currentSection.content += ' ' + trimmedLine;
          currentSection.rawContent += '\n' + line;
        }
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }, [processedContent]);

  useEffect(() => {
    if (content) {
      devLog('MarkdownRenderer->content', {
        content: content,
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

  // 渲染单个段落
  const renderSection = (section: MarkdownSection) => {
    // 检查是否应该高亮：增强匹配逻辑
    const isHighlighted =
      highlightedSection === section.mappingId ||
      highlightedSection === section.id ||
      // Tweet节点的多种匹配方式 - 增强类型兼容性
      (hoveredTweetId &&
        section.tweetId &&
        (section.tweetId === hoveredTweetId ||
          section.tweetId.toString() === hoveredTweetId.toString() ||
          Number(section.tweetId) === Number(hoveredTweetId))) ||
      // Group节点的多种匹配方式 - 增强类型兼容性
      (hoveredTweetId &&
        hoveredTweetId.startsWith('group-') &&
        section.groupId &&
        (section.groupId === hoveredTweetId.replace('group-', '') ||
          section.groupId.toString() === hoveredTweetId.replace('group-', '') ||
          Number(section.groupId) ===
            Number(hoveredTweetId.replace('group-', '')))) ||
      // 编辑状态高亮 - 新增：当section正在被编辑时保持高亮
      (editingNodeId &&
        ((section.tweetId &&
          (section.tweetId === editingNodeId ||
            section.tweetId.toString() === editingNodeId.toString() ||
            Number(section.tweetId) === Number(editingNodeId))) ||
          (editingNodeId.startsWith('group-') &&
            section.groupId &&
            (section.groupId === editingNodeId.replace('group-', '') ||
              section.groupId.toString() ===
                editingNodeId.replace('group-', '') ||
              Number(section.groupId) ===
                Number(editingNodeId.replace('group-', '')))) ||
          editingNodeId === section.id)) ||
      // 生图状态高亮 - 新增
      (generatingImageTweetIds &&
        section.tweetId &&
        generatingImageTweetIds.some(
          (id) =>
            section.tweetId === id ||
            section.tweetId?.toString() === id.toString() ||
            Number(section.tweetId) === Number(id),
        )) ||
      // 选中状态高亮 - 新增
      (selectedNodeId &&
        section.tweetId &&
        (section.tweetId === selectedNodeId ||
          section.tweetId.toString() === selectedNodeId.toString() ||
          Number(section.tweetId) === Number(selectedNodeId))) ||
      // Fallback：直接ID匹配
      hoveredTweetId === section.id;

    // 检查是否正在loading - 增强匹配逻辑
    const isLoading = Boolean(
      loadingTweetId && // Tweet节点的多种匹配方式
        ((section.tweetId &&
          (section.tweetId === loadingTweetId ||
            section.tweetId.toString() === loadingTweetId.toString() ||
            Number(section.tweetId) === Number(loadingTweetId))) ||
          // Group节点的多种匹配方式
          (loadingTweetId.startsWith('group-') &&
            section.groupId &&
            (section.groupId === loadingTweetId.replace('group-', '') ||
              section.groupId.toString() ===
                loadingTweetId.replace('group-', '') ||
              Number(section.groupId) ===
                Number(loadingTweetId.replace('group-', '')))) ||
          // Fallback：直接ID匹配
          loadingTweetId === section.id),
    );

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
            <div className="mt-[48px] flex flex-col  justify-center gap-[16px]">
              {collectedImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative flex aspect-video h-[400px] justify-center"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    className="h-[400px] w-auto rounded-lg object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
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
