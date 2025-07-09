'use client';

import { Button, cn, Image } from '@heroui/react';
import { CopyIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import { createClient } from '../../lib/supabase/client';
import { addToast } from '../base/toast';
import EditorPro from '../editorPro/index';
import { ImageLoadingAnimation } from '../ui/ImageLoadingAnimation';

import {
  getBaseClasses,
  getHeadingClass,
  getHighlightClasses,
  markdownStyles,
  shouldEnableInteraction,
} from './markdownStyles';

interface MarkdownSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'tweet' | 'group';
  level?: number;
  content: string;
  rawContent: string;
  mappingId?: string;
  tweetId?: string;
  groupIndex?: number;
  tweetIndex?: number;
  groupId?: string;
}

interface SectionRendererProps {
  section: MarkdownSection;
  isHighlighted?: boolean;
  isLoading?: boolean;
  onSectionHover?: (sectionId: string | null) => void;
  onImageClick?: (image: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  }) => void;
  onTweetImageEdit?: (tweetData: any) => void;
  onTweetContentChange?: (tweetId: string, newContent: string) => void;
  onDirectGenerate?: (tweetData: any) => void;
  generatingImageTweetIds?: string[];
  tweetData?: any;
  imageData?: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  setSectionRef?: (sectionId: string, element: HTMLDivElement | null) => void;
}

export function SectionRenderer({
  section,
  isHighlighted = false,
  isLoading = false,
  onSectionHover,
  onImageClick,
  onTweetImageEdit,
  onTweetContentChange,
  onDirectGenerate,
  generatingImageTweetIds,
  tweetData,
  imageData,
  setSectionRef,
}: SectionRendererProps) {
  // 状态来跟踪编辑器的当前内容（仅用于 tweet 类型）
  const [currentEditorContent, setCurrentEditorContent] = useState('');

  const supabase = createClient();

  // 处理编辑器内容变化的回调
  const handleEditorChange = useCallback(
    (newValue: string) => {
      try {
        const parsed = JSON.parse(newValue);
        // 将HTML内容转换为纯文本用于复制
        const plainText = parsed.content
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        setCurrentEditorContent(plainText);

        // 如果是 tweet 类型，则更新数据库
        // 由于 EditorPro 现在已经有防抖了，这里直接调用
        if (section.type === 'tweet' && section.tweetId) {
          console.log('handleEditorChange', section.tweetId, plainText);
          onTweetContentChange?.(section.tweetId!, plainText);
        }
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [section.type, section.tweetId, onTweetContentChange],
  );

  // 为 tweet 类型初始化编辑器内容
  useEffect(() => {
    if (section.type === 'tweet') {
      const lines = section.content.split('\n\n');
      let contentLines = [];

      const titleLine = lines.find((line) => line.startsWith('#'));
      if (titleLine) {
        contentLines = lines.filter(
          (line) => !line.startsWith('#') && line.trim() !== '',
        );
      } else {
        contentLines = lines.slice(1).filter((line) => line.trim() !== '');
      }

      const content = contentLines.join('\n\n');
      const textContent = content.replace(/!\[(.*?)\]\((.*?)\)\s*/, '').trim();
      setCurrentEditorContent(textContent);
    }
  }, [section]);
  // 创建鼠标事件处理器
  const createMouseHandlers = useCallback(() => {
    const shouldInteract = shouldEnableInteraction(section);

    const handleEnter = () => {
      if (!shouldInteract) return;

      if (section.type === 'tweet' && section.tweetId) {
        console.log('Section renderer hover tweet:', section.tweetId);
        onSectionHover?.(section.tweetId);
      } else if (section.type === 'group' && section.groupId) {
        console.log('Section renderer hover group:', section.groupId);
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
  }, [section, onSectionHover]);

  // 渲染表情符号
  const renderEmoji = useCallback((text: string) => {
    return text.replace(/[🧵📊💡🔧🚀✨]/gu, (match) =>
      markdownStyles.formatting.emoji.replace('$1', match),
    );
  }, []);

  // 判断是否需要交互效果
  const shouldInteract = shouldEnableInteraction(section);

  const baseClasses = getBaseClasses(shouldInteract);
  const highlightClasses = getHighlightClasses(isHighlighted, shouldInteract);
  const loadingClasses = isLoading ? markdownStyles.states.loading : '';

  // 创建鼠标事件处理器
  const { handleEnter, handleLeave } = createMouseHandlers();

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
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
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
            ref={(el) => setSectionRef?.(section.id, el)}
            className={`${baseClasses} ${highlightClasses} ${loadingClasses} mb-6`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
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
              <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
                点击编辑图片
              </div>
            </div>
          </div>
        );
      }

      // 处理普通段落
      const processedParagraphContent = (section.content || '')
        .replace(/\*\*(.*?)\*\*/g, markdownStyles.formatting.bold)
        .replace(/\*(.*?)\*/g, markdownStyles.formatting.italic)
        .replace(/#([^\s#]+)/g, markdownStyles.formatting.hashtag);

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
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
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
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
      // 改进的标题和内容分离逻辑
      const lines = section.content.split('\n\n');
      let title = '';
      let contentLines = [];

      // 查找标题
      const titleLine = lines.find((line) => line.startsWith('#'));
      if (titleLine) {
        title = titleLine.replace(/^#+\s*/, '').trim();
        contentLines = lines.filter(
          (line) => !line.startsWith('#') && line.trim() !== '',
        );
      } else {
        title = lines[0] || section.content;
        contentLines = lines.slice(1).filter((line) => line.trim() !== '');
      }

      const content = contentLines.join('\n\n');

      // 检查内容中是否包含图片语法
      const contentImageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
      let textContent = content;
      let tweetImageSrc = null;
      let tweetImageAlt = null;

      if (contentImageMatch) {
        textContent = content.replace(/!\[(.*?)\]\((.*?)\)\s*/, '').trim();
        tweetImageSrc = contentImageMatch[2];
        tweetImageAlt = contentImageMatch[1];
      }

      // 获取当前tweet的完整数据
      const currentTweetData = tweetData?.nodes
        ?.flatMap((group: any) => group.tweets)
        ?.find(
          (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
        );

      // 计算tweet序号信息
      const allTweets =
        tweetData?.nodes?.flatMap((group: any) => group.tweets) || [];
      const totalTweets = allTweets.length;
      const currentTweetIndex = allTweets.findIndex(
        (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
      );
      const tweetNumber = currentTweetIndex >= 0 ? currentTweetIndex + 1 : 0;

      // 获取当前tweet的图片URL
      const currentTweetImageUrl = currentTweetData?.image_url;

      // 准备 EditorPro 的数据格式
      const editorValue = JSON.stringify({
        content: textContent
          .replace(/\n\n/g, '<br>') // 转换换行为HTML
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-gray-900">$1</strong>',
          )
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          .replace(
            /#([^\s#]+)/g,
            '<span class="text-blue-600 font-medium">#$1</span>',
          ),
        type: 'doc',
        isEmpty: !textContent.trim(),
      });

      const isGeneratingImage =
        generatingImageTweetIds?.includes(section.tweetId || '') || false;

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} border border-gray-100`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className="absolute left-2 top-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {/* Tweet 序号显示 */}
          {totalTweets > 0 && tweetNumber > 0 && (
            <div className="text-[10px] font-medium text-black/60">
              ({tweetNumber}/{totalTweets})
            </div>
          )}

          {/* Tweet 内容使用 EditorPro 渲染 */}
          {textContent && textContent.trim() && (
            <div className="text-[14px] leading-[1.6] text-black">
              <EditorPro
                value={editorValue}
                onChange={handleEditorChange}
                isEdit={true}
                hideMenuBar={true}
                debounceMs={1000}
                className={{
                  base: 'border-none bg-transparent',
                  editorWrapper: 'p-0',
                  editor:
                    'prose prose-sm [&_.tiptap]:leading-inherit max-w-none bg-transparent text-black [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[6px] [&_.tiptap]:text-inherit',
                }}
              />
            </div>
          )}

          {/* 图片生成中的 Lottie 动画 */}
          {isGeneratingImage && (
            <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
              <ImageLoadingAnimation size={160} />
              <span className="text-sm text-gray-500">Generating image...</span>
            </div>
          )}

          {/* Tweet 图片 */}
          {(tweetImageSrc || currentTweetImageUrl) && !isGeneratingImage && (
            <div className="my-4 flex justify-center">
              <Image
                src={tweetImageSrc || currentTweetImageUrl}
                alt={tweetImageAlt || `${title}配图`}
                width={400}
                height={400}
                className="w-full cursor-pointer rounded-lg shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                // onClick={() => {
                //   if (onDirectGenerate && currentTweetData) {
                //     onDirectGenerate(currentTweetData);
                //   } else if (onTweetImageEdit && currentTweetData) {
                //     onTweetImageEdit(currentTweetData);
                //   }
                // }}
              />
            </div>
          )}

          {/* 功能按钮 */}
          <div className="absolute right-[4px] top-[4px] flex items-center justify-end">
            <TweetImageButton
              currentTweetData={currentTweetData}
              onTweetImageEdit={onTweetImageEdit}
              isGeneratingImage={isGeneratingImage}
              onDirectGenerate={onDirectGenerate}
            />
            <CopyButton
              currentTweetData={currentTweetData}
              currentContent={currentEditorContent}
              tweetNumber={tweetNumber}
              totalTweets={totalTweets}
            />
          </div>
        </div>
      );

    case 'group':
      // 分组处理逻辑
      const groupLines = section.content.split('\n\n');
      let groupTitle = '';
      let groupContent = '';

      const groupTitleLine = groupLines.find((line) => line.startsWith('#'));
      if (groupTitleLine) {
        groupTitle = groupTitleLine.replace(/^#+\s*/, '').trim();
        const groupContentLines = groupLines.filter(
          (line) => !line.startsWith('#') && line.trim() !== '',
        );
        groupContent = groupContentLines.join('\n\n');
      } else {
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
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} mb-6`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
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
}

// Tweet图片编辑按钮组件
function TweetImageButton({
  currentTweetData,
  onTweetImageEdit,
  isGeneratingImage,
  onDirectGenerate,
}: {
  currentTweetData?: any;
  onTweetImageEdit?: (tweetData: any) => void;
  isGeneratingImage?: boolean;
  onDirectGenerate?: (tweetData: any) => void;
}) {
  const handleImageAction = () => {
    if (onDirectGenerate && currentTweetData) {
      onDirectGenerate(currentTweetData);
    } else if (onTweetImageEdit && currentTweetData) {
      onTweetImageEdit(currentTweetData);
    }
  };

  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      className={cn(markdownStyles.source.button)}
      onPress={handleImageAction}
      isLoading={isGeneratingImage}
    >
      <Image src="/icons/image.svg" alt="edit" width={20} height={20} />
    </Button>
  );
}

// 将图片转换为PNG格式（剪贴板API支持的格式）
async function convertImageToPNG(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        }, 'image/png');
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(imageBlob);
  });
}

// 将内容转换为 Twitter 兼容格式
function convertToTwitterFormat(content: string, tweetNumber?: number, totalTweets?: number): string {
  if (!content) return '';

  let twitterContent = content;

  // 处理列表 - 转换为 Twitter 兼容格式
  // 处理无序列表 (- 或 *)
  twitterContent = twitterContent.replace(/^[-*]\s+(.+)$/gm, '• $1');

  // 处理有序列表
  twitterContent = twitterContent.replace(/^\d+\.\s+(.+)$/gm, '• $1');

  // 移除 Markdown 格式标记但保留内容
  twitterContent = twitterContent.replace(/\*\*(.+?)\*\*/g, '$1'); // 粗体
  twitterContent = twitterContent.replace(/\*(.+?)\*/g, '$1'); // 斜体
  twitterContent = twitterContent.replace(/!\[.*?\]\(.*?\)/g, ''); // 图片链接

  // 处理换行 - 先将所有双换行替换为单换行（列表项之间不应该有空行）
  twitterContent = twitterContent.replace(/\n\n/g, '\n');

  // 但是在非列表段落之间保留空行
  // 识别列表结束后的段落，在其前面加上空行
  twitterContent = twitterContent.replace(/(\n• .+)(\n[^•])/g, '$1\n$2');

  // 清理多余的空行
  twitterContent = twitterContent.replace(/\n{3,}/g, '\n\n');
  twitterContent = twitterContent.trim();

  // 添加序号信息
  if (tweetNumber && totalTweets && totalTweets > 1) {
    twitterContent = `(${tweetNumber}/${totalTweets})\n\n${twitterContent}`;
  }

  return twitterContent;
}

// 复制内容和图片到剪贴板
async function copyTwitterContent(
  content: string,
  imageUrl?: string,
  tweetNumber?: number,
  totalTweets?: number,
): Promise<void> {
  const twitterFormattedContent = convertToTwitterFormat(content, tweetNumber, totalTweets);

  try {
    if (imageUrl) {
      console.log('Attempting to copy content with image:', imageUrl);

      // 获取图片blob
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('Image blob type:', blob.type, 'size:', blob.size);

      // 检查是否是有效的图片类型
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid image type: ${blob.type}`);
      }

      // 将图片转换为PNG格式（剪贴板API支持的格式）
      const convertedBlob = await convertImageToPNG(blob);
      console.log('Converted image blob type:', convertedBlob.type, 'size:', convertedBlob.size);

      // 同时复制文本和图片
      await navigator.clipboard.write([
        new ClipboardItem({
          [convertedBlob.type]: convertedBlob,
          'text/plain': new Blob([twitterFormattedContent], {
            type: 'text/plain',
          }),
        }),
      ]);

      console.log('Image and text copied successfully');
      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    } else {
      // 只复制文本
      await navigator.clipboard.writeText(twitterFormattedContent);
      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    }
  } catch (error) {
    console.error('Failed to copy content:', error);
    // 降级处理：只复制文本
    try {
      await navigator.clipboard.writeText(twitterFormattedContent);
      addToast({
        title: 'Copied text (image copy failed)',
        color: 'warning',
      });
    } catch (textError) {
      console.error('Failed to copy text:', textError);
      addToast({
        title: 'Copy failed',
        color: 'danger',
      });
    }
  }
}

// 复制按钮组件
function CopyButton({
  currentTweetData,
  currentContent,
  tweetNumber,
  totalTweets,
}: {
  currentTweetData?: any;
  currentContent?: string;
  tweetNumber?: number;
  totalTweets?: number;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // 优先使用编辑器中的当前内容，如果没有则回退到原始数据
  const contentToCopy = currentContent || currentTweetData?.content || '';
  const imageUrl = currentTweetData?.image_url;

  const handleCopy = async () => {
    if (isLoading) return; // 防止重复点击

    console.log('=== Copy Button Clicked ===');
    console.log('Content to copy:', contentToCopy);
    console.log('Image URL:', imageUrl);
    console.log('Tweet number:', tweetNumber);
    console.log('Total tweets:', totalTweets);
    console.log('Current tweet data:', currentTweetData);

    setIsLoading(true);
    try {
      await copyTwitterContent(contentToCopy, imageUrl, tweetNumber, totalTweets);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      isIconOnly
      size="sm"
      variant="light"
      className={markdownStyles.source.button}
      onPress={handleCopy}
      isLoading={isLoading}
      disabled={isLoading}
    >
      <CopyIcon size={20} />
    </Button>
  );
}
