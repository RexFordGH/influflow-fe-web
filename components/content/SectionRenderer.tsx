'use client';

import { Button, cn, Image } from '@heroui/react';
import { CopyIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import { addToast } from '../base/toast';
import EditorPro from '../editorPro/index';
import { ImageLoadingAnimation } from '../ui/ImageLoadingAnimation';
import { LocalImageUploader } from './LocalImageUploader';

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
  onLocalImageUploadSuccess: (
    result: { url: string; alt: string },
    tweetData: any,
  ) => void;
  onImageSelect?: (
    result: { localUrl: string; file: File },
    tweetData: any,
  ) => void;
  onDirectGenerate?: (tweetData: any) => void;
  generatingImageTweetIds?: string[];
  localImageUrls?: Record<string, string>;
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
  onLocalImageUploadSuccess,
  onImageSelect,
  onDirectGenerate,
  generatingImageTweetIds,
  localImageUrls,
  tweetData,
  imageData,
  setSectionRef,
}: SectionRendererProps) {
  const [currentEditorContent, setCurrentEditorContent] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();

  useEffect(() => {
    // This effect synchronizes the imageUri state based on props for the current section.
    if (section.type !== 'tweet') {
      setImageUri(undefined); // Clean up state for non-tweet sections
      return;
    }

    const currentTweetData = tweetData?.nodes
      ?.flatMap((group: any) => group.tweets)
      ?.find((tweet: any) => tweet.tweet_number.toString() === section.tweetId);
    const currentTweetImageUrl = currentTweetData?.image_url;
    const localImageUrl = localImageUrls?.[section.tweetId || ''];

    // Priority 1: A new local image is selected.
    if (localImageUrl) {
      if (imageUri !== localImageUrl) {
        setImageUri(localImageUrl);
      }
      return;
    }

    // Priority 2: Seamless switch from local blob to remote URL.
    if (imageUri?.startsWith('blob:') && currentTweetImageUrl) {
      const preloader = new window.Image();
      preloader.src = currentTweetImageUrl;
      preloader.onload = () => {
        setImageUri(currentTweetImageUrl);
      };
      return;
    }

    // Priority 3 (Fallback): Sync with remote URL if no local interaction is pending.
    // This also handles the initial setting of the image URI.
    if (!imageUri?.startsWith('blob:') && imageUri !== currentTweetImageUrl) {
      setImageUri(currentTweetImageUrl);
    }
  }, [section, localImageUrls, tweetData, imageUri]);

  const handleEditorChange = useCallback(
    (newValue: string) => {
      try {
        const parsed = JSON.parse(newValue);
        const plainText = parsed.content
          .replace(/<br\s*\/?\s*>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        setCurrentEditorContent(plainText);

        if (section.type === 'tweet' && section.tweetId) {
          onTweetContentChange?.(section.tweetId!, plainText);
        }
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [section.type, section.tweetId, onTweetContentChange],
  );

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

  const createMouseHandlers = useCallback(() => {
    const shouldInteract = shouldEnableInteraction(section);

    const handleEnter = () => {
      if (!shouldInteract) return;

      if (section.type === 'tweet' && section.tweetId) {
        onSectionHover?.(section.tweetId);
      } else if (section.type === 'group' && section.groupId) {
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

  const renderEmoji = useCallback((text: string) => {
    return text.replace(/[🧵📊💡🔧🚀✨]/gu, (match) =>
      markdownStyles.formatting.emoji.replace('$1', match),
    );
  }, []);

  const shouldInteract = shouldEnableInteraction(section);
  const baseClasses = getBaseClasses(shouldInteract);
  const highlightClasses = getHighlightClasses(isHighlighted, shouldInteract);
  const loadingClasses = isLoading ? markdownStyles.states.loading : '';
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
      const lines = section.content.split('\n\n');
      let title = '';
      let contentLines = [];

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
      const contentImageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
      let textContent = content;
      let tweetImageSrc = null;
      let tweetImageAlt = null;

      if (contentImageMatch) {
        textContent = content.replace(/!\[(.*?)\]\((.*?)\)\s*/, '').trim();
        tweetImageSrc = contentImageMatch[2];
        tweetImageAlt = contentImageMatch[1];
      }

      const currentTweetData = tweetData?.nodes
        ?.flatMap((group: any) => group.tweets)
        ?.find(
          (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
        );

      const allTweets =
        tweetData?.nodes?.flatMap((group: any) => group.tweets) || [];
      const totalTweets = allTweets.length;
      const currentTweetIndex = allTweets.findIndex(
        (tweet: any) => tweet.tweet_number.toString() === section.tweetId,
      );
      const tweetNumber = currentTweetIndex >= 0 ? currentTweetIndex + 1 : 0;
      const currentTweetImageUrl = currentTweetData?.image_url;
      const imageToDisplay = imageUri;

      const editorValue = JSON.stringify({
        content: textContent
          .replace(/\n\n/g, '<br>')
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

          {totalTweets > 0 && tweetNumber > 0 && (
            <div className="text-[10px] font-medium text-black/60">
              ({tweetNumber}/{totalTweets})
            </div>
          )}

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

          {isGeneratingImage && (
            <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
              <ImageLoadingAnimation size={160} />
              <span className="text-sm text-gray-500">Generating image...</span>
            </div>
          )}

          {(tweetImageSrc || imageToDisplay) && !isGeneratingImage && (
            <div className="my-4 flex justify-center">
              <Image
                src={tweetImageSrc || imageToDisplay}
                alt={tweetImageAlt || `${title}配图`}
                width={0}
                height={400}
                className="w-auto max-h-[400px] object-cover cursor-pointer rounded-lg shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              />
            </div>
          )}

          <div className="absolute right-[4px] top-[4px] flex items-center justify-end gap-1">
            <LocalImageUploader
              tweetData={currentTweetData}
              onUploadSuccess={onLocalImageUploadSuccess}
              onImageSelect={onImageSelect}
            />
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

function convertToTwitterFormat(
  content: string,
  tweetNumber?: number,
  totalTweets?: number,
): string {
  if (!content) return '';

  let twitterContent = content;

  twitterContent = twitterContent.replace(/^[-*]\s+(.+)$/gm, '• $1');
  twitterContent = twitterContent.replace(/^\d+\.\s+(.+)$/gm, '• $1');
  twitterContent = twitterContent.replace(/\*\*(.+?)\*\*/g, '$1');
  twitterContent = twitterContent.replace(/\*(.+?)\*/g, '$1');
  twitterContent = twitterContent.replace(/!\[.*?\]\(.*?\)/g, '');
  twitterContent = twitterContent.replace(/\n\n/g, '\n');
  twitterContent = twitterContent.replace(/(\n• .+)(\n[^•])/g, '$1\n$2');
  twitterContent = twitterContent.replace(/\n{3,}/g, '\n\n');
  twitterContent = twitterContent.trim();

  if (tweetNumber && totalTweets && totalTweets > 1) {
    twitterContent = `(${tweetNumber}/${totalTweets})\n${twitterContent}`;
  }

  return twitterContent;
}

async function copyTwitterContent(
  content: string,
  imageUrl?: string,
  tweetNumber?: number,
  totalTweets?: number,
): Promise<void> {
  const twitterFormattedContent = convertToTwitterFormat(
    content,
    tweetNumber,
    totalTweets,
  );

  try {
    if (imageUrl) {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid image type: ${blob.type}`);
      }

      const convertedBlob = await convertImageToPNG(blob);

      await navigator.clipboard.write([
        new ClipboardItem({
          [convertedBlob.type]: convertedBlob,
          'text/plain': new Blob([twitterFormattedContent], {
            type: 'text/plain',
          }),
        }),
      ]);

      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    } else {
      await navigator.clipboard.writeText(twitterFormattedContent);
      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    }
  } catch (error) {
    console.error('Failed to copy content:', error);
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

  const contentToCopy = currentContent || currentTweetData?.content || '';
  const imageUrl = currentTweetData?.image_url;

  const handleCopy = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await copyTwitterContent(
        contentToCopy,
        imageUrl,
        tweetNumber,
        totalTweets,
      );
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
