'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  image?: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  onSectionHover?: (sectionId: string | null) => void;
  onSourceClick?: (sectionId: string) => void;
  onImageClick?: (image: { url: string; alt: string; caption?: string; prompt?: string }) => void;
  highlightedSection?: string | null;
}

interface MarkdownSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list';
  level?: number;
  content: string;
  rawContent: string;
}

export function MarkdownRenderer({
  content,
  image,
  onSectionHover,
  onSourceClick,
  onImageClick,
  highlightedSection,
}: MarkdownRendererProps) {
  // 解析Markdown为结构化数据
  const sections = useMemo(() => {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    let sectionIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('#')) {
        // 标题
        if (currentSection) {
          sections.push(currentSection);
        }

        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const text = trimmedLine.replace(/^#+\s*/, '');

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
      } else if (trimmedLine) {
        // 段落
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
  }, [content]);

  // 渲染单个段落
  const renderSection = (section: MarkdownSection, index: number) => {
    const isHighlighted = highlightedSection === section.id;
    const baseClasses =
      'transition-all duration-200 p-2 rounded-lg relative group';
    const highlightClasses = isHighlighted
      ? 'bg-yellow-50 border-l-4 border-yellow-400'
      : 'hover:bg-gray-50';

    const handleMouseEnter = () => onSectionHover?.(section.id);
    const handleMouseLeave = () => onSectionHover?.(null);

    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(section.level || 1, 6)}` as
          | 'h1'
          | 'h2'
          | 'h3'
          | 'h4'
          | 'h5'
          | 'h6';
        const headingClasses = {
          1: 'text-3xl font-bold text-gray-900 mb-4',
          2: 'text-2xl font-semibold text-gray-800 mb-3',
          3: 'text-xl font-medium text-gray-800 mb-2',
          4: 'text-lg font-medium text-gray-700 mb-2',
          5: 'text-base font-medium text-gray-700 mb-1',
          6: 'text-sm font-medium text-gray-600 mb-1',
        };

        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <HeadingTag
              className={
                headingClasses[section.level as keyof typeof headingClasses] ||
                headingClasses[6]
              }
            >
              {section.content}
            </HeadingTag>
            <SourceButton
              sectionId={section.id}
              onSourceClick={onSourceClick}
            />
          </div>
        );

      case 'paragraph':
        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <p className="mb-4 leading-relaxed text-gray-700">
              {section.content}
            </p>
            <SourceButton
              sectionId={section.id}
              onSourceClick={onSourceClick}
            />
          </div>
        );

      case 'list':
        const listItems = section.content
          .split('\n')
          .filter((item) => item.trim());
        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <ul className="mb-4 space-y-2">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start text-gray-700">
                  <span className="mr-3 mt-2 inline-block size-2 shrink-0 rounded-full bg-gray-400" />
                  <span>
                    {item.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')}
                  </span>
                </li>
              ))}
            </ul>
            <SourceButton
              sectionId={section.id}
              onSourceClick={onSourceClick}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-none p-6">
        {/* 图片显示 */}
        {image && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
              <img
                src={image.url}
                alt={image.alt}
                className="h-auto w-full object-cover"
                onClick={() => onImageClick?.(image)}
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3 text-white">
                  <p className="text-sm">{image.caption}</p>
                </div>
              )}
              {/* 编辑提示 */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity hover:opacity-100">
                点击编辑图片
              </div>
            </div>
          </div>
        )}

        {/* Markdown内容 */}
        <div className="space-y-1">
          {sections.map((section, index) => renderSection(section, index))}
        </div>
      </div>
    </div>
  );
}

// 信息来源按钮组件
function SourceButton({
  sectionId,
  onSourceClick,
}: {
  sectionId: string;
  onSourceClick?: (sectionId: string) => void;
}) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
      onPress={() => onSourceClick?.(sectionId)}
    >
      <InformationCircleIcon className="size-4" />
    </Button>
  );
}
