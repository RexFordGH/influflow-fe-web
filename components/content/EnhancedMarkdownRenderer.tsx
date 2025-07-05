'use client';

import { Button, Image } from '@heroui/react';
import { useCallback, useMemo, useState } from 'react';

import {
  getBaseClasses,
  getHeadingClass,
  getHighlightClasses,
  markdownStyles,
  shouldEnableInteraction,
} from './markdownStyles';

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
  onTweetImageEdit?: (tweetId: string, tweetData: any) => void; // 新增：tweet图片编辑回调
  highlightedSection?: string | null;
  hoveredTweetId?: string | null; // 新增：从思维导图hover传递的tweetId
  loadingTweetId?: string | null; // 新增：loading状态的tweetId
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
  onTweetImageEdit, // 新增tweet图片编辑回调
  highlightedSection,
  hoveredTweetId, // 新增参数
  loadingTweetId, // 新增loading参数
  imageData, // 图片数据
  tweetData, // 新增tweet数据
}: EnhancedMarkdownRendererProps) {
  const [selectedSourceSection, setSelectedSourceSection] = useState<
    string | null
  >(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // 处理图片占位符
  const processedContent = useMemo(() => {
    // 确保有默认的图片URL来替换PLACEHOLDER_IMAGE
    const defaultImageUrl = imageData?.url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop&crop=center';
    return content.replace('PLACEHOLDER_IMAGE', defaultImageUrl);
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

  // 渲染表情符号 - 移到组件顶层
  const renderEmoji = useCallback((text: string) => {
    return text.replace(/[🧵📊💡🔧🚀✨]/gu, (match) =>
      markdownStyles.formatting.emoji.replace('$1', match),
    );
  }, []);

  // 创建鼠标事件处理器工厂函数
  const createMouseHandlers = useCallback(
    (section: MarkdownSection) => {
      const shouldInteract = shouldEnableInteraction(section);

      const handleEnter = () => {
        if (!shouldInteract) return;

        if (section.type === 'tweet' && section.tweetId) {
          console.log('Markdown section hover tweet:', section.tweetId);
          onSectionHover?.(section.tweetId);
        } else if (section.type === 'group' && section.groupId) {
          console.log('Markdown section hover group:', section.groupId);
          onSectionHover?.(`group-${section.groupId}`);
        } else {
          const targetId = section.mappingId || section.id;
          onSectionHover?.(targetId);
        }
      };

      const handleLeave = () => {
        if (!shouldInteract) return;
        onSectionHover?.(null);
      };

      return { handleEnter, handleLeave };
    },
    [onSectionHover],
  );

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
    const isLoading =
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
        loadingTweetId === section.id);

    // 判断是否需要交互效果
    const shouldInteract = shouldEnableInteraction(section);

    const baseClasses = getBaseClasses(shouldInteract);
    const highlightClasses = getHighlightClasses(isHighlighted, shouldInteract);
    const loadingClasses = isLoading ? markdownStyles.states.loading : '';

    // 创建当前 section 的鼠标事件处理器
    const { handleEnter: sectionMouseEnter, handleLeave: sectionMouseLeave } =
      createMouseHandlers(section);

    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(section.level || 1, 6)}` as
          | 'h1'
          | 'h2'
          | 'h3'
          | 'h4'
          | 'h5'
          | 'h6';
        const headingClass = getHeadingClass(section.level || 1);

        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
          >
            {isLoading && (
              <div className={markdownStyles.loading.indicator}>
                <div className={markdownStyles.loading.spinner}></div>
              </div>
            )}
            <HeadingTag
              className={headingClass}
              dangerouslySetInnerHTML={{ __html: renderEmoji(section.content) }}
            />
          </div>
        );

      case 'paragraph':
        // 检查是否是图片markdown语法
        const imageMatch = section.content.match(/!\[(.*?)\]\((.*?)\)/);
        
        
        if (imageMatch) {
          const [, altText, imageSrc] = imageMatch;
          return (
            <div
              key={section.id}
              className={`${baseClasses} ${highlightClasses} ${loadingClasses} mb-6`}
              onMouseEnter={sectionMouseEnter}
              onMouseLeave={sectionMouseLeave}
            >
              {isLoading && (
                <div className={markdownStyles.loading.zIndex}>
                  <div className={markdownStyles.loading.spinner}></div>
                </div>
              )}
              <div className="relative cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                <img
                  src={imageSrc}
                  alt={altText}
                  className={markdownStyles.image.image}
                  onClick={() =>
                    onImageClick?.({
                      url: imageSrc,
                      alt: altText,
                      caption: imageData?.caption,
                      prompt: imageData?.prompt,
                    })
                  }
                />
                {imageData?.caption && (
                  <div className={markdownStyles.image.overlay}>
                    <p className={markdownStyles.image.caption}>
                      {imageData.caption}
                    </p>
                  </div>
                )}
                {/* 编辑提示 */}
                <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
                  点击编辑图片
                </div>
              </div>
            </div>
          );
        }

        // 处理普通段落 - 使用统一样式配置
        const processedParagraphContent = (section.content || '')
          .replace(/\*\*(.*?)\*\*/g, markdownStyles.formatting.bold)
          .replace(/\*(.*?)\*/g, markdownStyles.formatting.italic)
          .replace(/#([^\s#]+)/g, markdownStyles.formatting.hashtag);


        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
          >
            {isLoading && (
              <div className={markdownStyles.loading.indicator}>
                <div className={markdownStyles.loading.spinner}></div>
              </div>
            )}
            <p
              className={markdownStyles.text.paragraph}
              dangerouslySetInnerHTML={{ __html: processedParagraphContent }}
            />
          </div>
        );

      case 'list':
        const listItems = section.content
          .split('\n')
          .filter((item) => item.trim());
        const isNumberedList = /^\d+/.test(listItems[0] || '');

        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
          >
            {isLoading && (
              <div className={markdownStyles.loading.indicator}>
                <div className={markdownStyles.loading.spinner}></div>
              </div>
            )}
            {isNumberedList ? (
              <ol className={markdownStyles.lists.orderedContainer}>
                {listItems.map((item, idx) => (
                  <li key={idx} className={markdownStyles.lists.orderedItem}>
                    <span className={markdownStyles.lists.itemContent}>
                      {item
                        .replace(/^\d+\.\s*/, '')
                        .replace(
                          /^\*\*(.*?)\*\*/,
                          '<strong class="font-semibold">$1</strong>',
                        )}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className={markdownStyles.lists.container}>
                {listItems.map((item, idx) => (
                  <li key={idx} className={markdownStyles.lists.item}>
                    <span className={markdownStyles.lists.bullet} />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: item
                          .replace(/^[-*]\s*/, '')
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="font-semibold text-gray-900">$1</strong>',
                          ),
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'tweet':
        // 改进的标题和内容分离逻辑，支持div内的标题
        const lines = section.content.split('\n\n');
        let title = '';
        let contentLines = [];

        // 查找标题（可能是第一行或包含#的行）
        const titleLine = lines.find((line) => line.startsWith('#'));
        if (titleLine) {
          // 移除标题前缀获取纯标题文本
          title = titleLine.replace(/^#+\s*/, '').trim();
          contentLines = lines.filter(
            (line) => !line.startsWith('#') && line.trim() !== '',
          );
        } else {
          // 如果没有标题标记，使用第一行作为标题
          title = lines[0] || section.content;
          contentLines = lines.slice(1).filter((line) => line.trim() !== '');
        }

        const content = contentLines.join('\n\n');

        // 检查内容中是否包含图片语法，并分离图片和文本内容
        const contentImageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
        let textContent = content;
        let tweetImageSrc = null;
        let tweetImageAlt = null;
        
        if (contentImageMatch) {
          // 从内容中移除图片语法，只保留文本部分
          textContent = content.replace(/!\[(.*?)\]\((.*?)\)\s*/, '').trim();
          tweetImageSrc = contentImageMatch[2];
          tweetImageAlt = contentImageMatch[1];
        }

        // 处理文本内容，保留换行和格式
        const processedTweetContent = textContent
          .replace(/\n/g, '<br>') // 转换换行为HTML
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-gray-900">$1</strong>',
          )
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          .replace(
            /#([^\s#]+)/g,
            '<span class="text-blue-600 font-medium">#$1</span>',
          );

        // 根据原始level或者推断的level设置标题样式
        const titleLevel = section.level || 3;
        const getTitleComponent = () => {
          const titleClass = getHeadingClass(titleLevel);

          switch (titleLevel) {
            case 1:
              return <h1 className={titleClass}>{title}</h1>;
            case 2:
              return <h2 className={titleClass}>{title}</h2>;
            case 3:
              return <h3 className={titleClass}>{title}</h3>;
            case 4:
              return <h4 className={titleClass}>{title}</h4>;
            case 5:
              return <h5 className={titleClass}>{title}</h5>;
            case 6:
              return <h6 className={titleClass}>{title}</h6>;
            default:
              return <h3 className={titleClass}>{title}</h3>;
          }
        };

        // 获取当前tweet的图片URL
        const currentTweetImageUrl = tweetData?.nodes
          ?.find((group: any) =>
            group.tweets?.find(
              (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
            ),
          )
          ?.tweets?.find(
            (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
          )?.image_url;

        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses} border border-gray-100`}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
          >
            {isLoading && (
              <div className="absolute left-2 top-2">
                <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            {/* Tweet Title with proper heading styling */}
            {title && <div className="my-[12px]">{getTitleComponent()}</div>}

            {/* Tweet Content */}
            {textContent && textContent.trim() && (
              <div
                className="text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: processedTweetContent }}
              />
            )}

            {/* Tweet Image from markdown or API data */}
            {(tweetImageSrc || currentTweetImageUrl) && (
              <div className="mt-4 mb-4">
                <img
                  src={tweetImageSrc || currentTweetImageUrl}
                  alt={tweetImageAlt || `${title}配图`}
                  className="w-full max-w-md rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  onClick={() =>
                    onImageClick?.({
                      url: tweetImageSrc || currentTweetImageUrl || '',
                      alt: tweetImageAlt || `${title}配图`,
                      caption: title,
                      prompt: title,
                    })
                  }
                />
              </div>
            )}

            <TweetImageButton
              tweetId={section.tweetId || ''}
              tweetData={tweetData}
              onTweetImageEdit={onTweetImageEdit}
            />
          </div>
        );

      case 'group':
        // 改进的分组标题处理，支持div内的标题
        const groupLines = section.content.split('\n\n');
        let groupTitle = '';
        let groupContent = '';

        // 查找标题行
        const groupTitleLine = groupLines.find((line) => line.startsWith('#'));
        if (groupTitleLine) {
          // 移除标题前缀获取纯标题文本
          groupTitle = groupTitleLine.replace(/^#+\s*/, '').trim();
          const groupContentLines = groupLines.filter(
            (line) => !line.startsWith('#') && line.trim() !== '',
          );
          groupContent = groupContentLines.join('\n\n');
        } else {
          // 如果没有标题标记，使用全部内容作为标题
          groupTitle = section.content;
        }

        // 根据原始level设置标题样式
        const groupTitleLevel = section.level || 2;
        const getGroupTitleComponent = () => {
          const titleClasses = {
            1: 'text-2xl font-bold text-gray-900',
            2: 'text-xl font-bold text-gray-800',
            3: 'text-lg font-semibold text-gray-800',
            4: 'text-base font-semibold text-gray-700',
            5: 'text-sm font-semibold text-gray-700',
            6: 'text-sm font-medium text-gray-600',
          };

          const titleClass =
            titleClasses[groupTitleLevel as keyof typeof titleClasses] ||
            titleClasses[2];

          switch (groupTitleLevel) {
            case 1:
              return <h1 className={titleClass}>{groupTitle}</h1>;
            case 2:
              return <h2 className={titleClass}>{groupTitle}</h2>;
            case 3:
              return <h3 className={titleClass}>{groupTitle}</h3>;
            case 4:
              return <h4 className={titleClass}>{groupTitle}</h4>;
            case 5:
              return <h5 className={titleClass}>{groupTitle}</h5>;
            case 6:
              return <h6 className={titleClass}>{groupTitle}</h6>;
            default:
              return <h2 className={titleClass}>{groupTitle}</h2>;
          }
        };

        return (
          <div
            key={section.id}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses} mb-6`}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
          >
            {isLoading && (
              <div className="absolute left-2 top-2">
                <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            {getGroupTitleComponent()}
            {groupContent && (
              <div className="mt-2 text-sm leading-relaxed text-gray-700">
                {groupContent}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className={markdownStyles.container.main}>
        <div className={markdownStyles.container.content}>
          <div className={markdownStyles.container.sections}>
            {sections.map((section) => renderSection(section))}
          </div>
        </div>
      </div>
    </>
  );
}

// Tweet图片编辑按钮组件
function TweetImageButton({
  tweetId,
  tweetData,
  onTweetImageEdit,
}: {
  tweetId: string;
  tweetData?: any;
  onTweetImageEdit?: (tweetId: string, tweetData: any) => void;
}) {
  const handleImageEdit = () => {
    if (onTweetImageEdit && tweetData) {
      onTweetImageEdit(tweetId, tweetData);
    }
  };

  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      className={markdownStyles.source.button}
      onPress={handleImageEdit}
    >
      <Image src="/icons/image.svg" alt="edit" width={20} height={20} />
    </Button>
  );
}
