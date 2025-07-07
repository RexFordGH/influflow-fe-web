'use client';

import { useMemo } from 'react';

import { markdownStyles } from './markdownStyles';
import { SectionRenderer } from './SectionRenderer';

interface EnhancedMarkdownRendererProps {
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
  highlightedSection?: string | null;
  hoveredTweetId?: string | null; // 新增：从思维导图hover传递的tweetId
  loadingTweetId?: string | null; // 新增：loading状态的tweetId
  generatingImageTweetId?: string | null; // 新增：正在生图的tweetId
  imageData?: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  tweetData?: any; // 新增：tweet数据，用于获取image_url
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

export function EnhancedMarkdownRenderer({
  content,
  onSectionHover,
  onSourceClick,
  onImageClick,
  onTweetImageEdit,
  highlightedSection,
  hoveredTweetId,
  loadingTweetId,
  generatingImageTweetId,
  imageData,
  tweetData,
}: EnhancedMarkdownRendererProps) {

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
      // 生图状态高亮 - 新增
      (generatingImageTweetId &&
        section.tweetId &&
        (section.tweetId === generatingImageTweetId ||
          section.tweetId.toString() === generatingImageTweetId.toString() ||
          Number(section.tweetId) === Number(generatingImageTweetId))) ||
      // Fallback：直接ID匹配
      hoveredTweetId === section.id;

    // Debug信息 - 增强版本，帮助排查"漏一个"问题
    if (
      hoveredTweetId &&
      (section.type === 'tweet' || section.type === 'group')
    ) {
      console.log(`Markdown section matching debug:`, {
        sectionType: section.type,
        sectionId: section.id,
        sectionTweetId: section.tweetId,
        sectionGroupId: section.groupId,
        hoveredTweetId,
        isHighlighted,
        matchDetails: {
          tweetIdMatch: section.tweetId === hoveredTweetId,
          tweetIdStringMatch:
            section.tweetId?.toString() === hoveredTweetId?.toString(),
          tweetIdNumberMatch:
            Number(section.tweetId) === Number(hoveredTweetId),
          groupIdMatch:
            section.groupId === hoveredTweetId?.replace('group-', ''),
          groupIdStringMatch:
            section.groupId?.toString() ===
            hoveredTweetId?.replace('group-', ''),
          groupIdNumberMatch:
            Number(section.groupId) ===
            Number(hoveredTweetId?.replace('group-', '')),
        },
      });
    }

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
        loadingTweetId === section.id)
    );

    return (
      <SectionRenderer
        key={section.id}
        section={section}
        isHighlighted={isHighlighted}
        isLoading={isLoading}
        onSectionHover={onSectionHover}
        onImageClick={onImageClick}
        onTweetImageEdit={onTweetImageEdit}
        tweetData={tweetData}
        imageData={imageData}
      />
    );
  };

  return (
    <div className={markdownStyles.container.main}>
      <div className={markdownStyles.container.content}>
        <div className={markdownStyles.container.sections}>
          {sections.map((section) => renderSection(section))}
        </div>
      </div>
    </div>
  );
}
