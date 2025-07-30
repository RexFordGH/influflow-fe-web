'use client';

import { Button, cn, Image, Tooltip } from '@heroui/react';
import { CopyIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import EditorPro from '@/components/editorPro';
import { ImageLoadingAnimation } from '@/components/ui/ImageLoadingAnimation';
import { MarkdownSection } from '@/utils/markdownUtils';
import { copyTwitterContent } from '@/utils/twitter';

import { LocalImageUploader } from './LocalImageUploader';
import {
  getBaseClasses,
  getHighlightClasses,
  markdownStyles,
  shouldEnableInteraction,
} from './markdownStyles';

export interface SectionRendererProps {
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
  onGroupTitleChange?: (groupId: string, newTitle: string) => void;
  onLocalImageUploadSuccess: (
    result: { url: string; alt: string },
    tweetData: any,
  ) => void;
  onImageSelect?: (
    result: { localUrl: string; file: File },
    tweetData: any,
  ) => void;
  onDirectGenerate?: (tweetData: any) => void;
  onDeleteImage?: (image: any) => void;
  onEditWithAI?: (nodeId: string) => void; // 新增：Edit with AI 回调
  editingNodeId?: string | null; // 新增：正在编辑的节点ID
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
  onGroupTitleChange,
  onLocalImageUploadSuccess,
  onImageSelect,
  onDirectGenerate,
  onDeleteImage,
  onEditWithAI,
  editingNodeId,
  generatingImageTweetIds,
  localImageUrls,
  tweetData,
  imageData,
  setSectionRef,
}: SectionRendererProps) {
  const [currentEditorContent, setCurrentEditorContent] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();

  useEffect(() => {
    if (section.type !== 'tweet') {
      setImageUri(undefined);
      return;
    }

    // Always prioritize the local image URL if it exists for the current tweet.
    const localImageUrl = localImageUrls?.[section.tweetId || ''];
    if (localImageUrl) {
      setImageUri(localImageUrl);
      return;
    }

    // If no local image, fall back to the remote URL from the tweet data.
    const currentTweetData = tweetData?.nodes
      ?.flatMap((group: any) => group.tweets)
      ?.find((tweet: any) => tweet.tweet_number.toString() === section.tweetId);
    const currentTweetImageUrl = currentTweetData?.image_url;

    // Set the image URI to the remote URL, which will be undefined if it doesn't exist,
    // correctly clearing the image.
    setImageUri(currentTweetImageUrl);
  }, [section.type, section.tweetId, localImageUrls, tweetData]);

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
        } else if (section.type === 'group' && section.groupId) {
          onGroupTitleChange?.(section.groupId, plainText);
        }
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [section, onTweetContentChange, onGroupTitleChange],
  );

  useEffect(() => {
    if (section.type === 'tweet') {
      // 直接使用 section.content，不再需要解析
      setCurrentEditorContent(section.content);
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
      // 直接使用 section 中的数据，不再解析
      const title = (section as any).title || '';
      const textContent = section.content;
      const tweetImageSrc = (section as any).imageUrl || null;
      const tweetImageAlt = title;

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
        content: textContent,
        type: 'doc',
        isEmpty: !textContent.trim(),
      });

      const isGeneratingImage =
        generatingImageTweetIds?.includes(section.tweetId || '') || false;

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} group border border-gray-100`}
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
            <div className="group relative my-4 flex justify-center">
              <Image
                src={tweetImageSrc || imageToDisplay}
                alt={tweetImageAlt || `${title}配图`}
                width={0}
                height={400}
                className="max-h-[400px] w-auto cursor-pointer rounded-lg object-cover shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              />
              <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  isIconOnly
                  onPress={() => {
                    if (onDeleteImage && currentTweetData) {
                      onDeleteImage({
                        src: currentTweetData.image_url,
                        alt:
                          currentTweetData.content ||
                          currentTweetData.title ||
                          'Image',
                        originalSectionId: `tweet-${currentTweetData.tweet_number}`,
                        tweetId: currentTweetData.tweet_number.toString(),
                      });
                    }
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
          )}

          <div
            className={`absolute right-[4px] top-[4px] flex items-center justify-end gap-1 transition-opacity ${
              // 如果当前section正在被编辑，始终显示按钮，否则hover时显示
              editingNodeId &&
              ((section.tweetId &&
                (section.tweetId === editingNodeId ||
                  section.tweetId.toString() === editingNodeId.toString())) ||
                editingNodeId === section.id)
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <EditWithAIButton
              nodeId={section.tweetId || section.id}
              onEditWithAI={onEditWithAI}
            />
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

      const groupTitleEditorValue = JSON.stringify({
        content: `<h3>${groupTitle}</h3>`,
        type: 'doc',
        isEmpty: !groupTitle.trim(),
      });

      return (
        <div
          key={section.id}
          ref={(el) => setSectionRef?.(section.id, el)}
          className={`${baseClasses} ${highlightClasses} ${loadingClasses} group relative mb-6`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className="absolute left-2 top-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          <EditorPro
            value={groupTitleEditorValue}
            onChange={handleEditorChange}
            isEdit={true}
            hideMenuBar={true}
            debounceMs={1000}
            className={{
              base: 'border-none bg-transparent',
              editorWrapper: 'p-0',
              editor: `prose max-w-none bg-transparent [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[6px] [&_.tiptap]:text-inherit [&_h3]:text-black`,
            }}
          />
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

export function EditWithAIButton({
  nodeId,
  onEditWithAI,
}: {
  nodeId: string;
  onEditWithAI?: (nodeId: string) => void;
}) {
  return (
    <Tooltip
      content="Edit with AI"
      delay={50}
      closeDelay={0}
      placement="top"
      classNames={{
        content: 'bg-black text-white',
        arrow: 'bg-black border-black',
      }}
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className={markdownStyles.source.button}
        onPress={() => onEditWithAI?.(nodeId)}
      >
        <Image
          src="/icons/Edit.svg"
          alt="edit"
          width={20}
          height={20}
          className="rounded-none"
        />
      </Button>
    </Tooltip>
  );
}

export function TweetImageButton({
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
    <Tooltip
      content="Generate Image"
      delay={50}
      closeDelay={0}
      placement="top"
      classNames={{
        content: 'bg-black text-white',
        arrow: 'bg-black border-black',
      }}
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className={cn(markdownStyles.source.button)}
        onPress={handleImageAction}
        isLoading={isGeneratingImage}
      >
        <Image
          src="/icons/genImage.svg"
          alt="edit"
          width={20}
          height={20}
          className="rounded-none"
        />
      </Button>
    </Tooltip>
  );
}

export function CopyButton({
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
    <Tooltip
      content="Copy"
      delay={50}
      closeDelay={0}
      placement="top"
      classNames={{
        content: 'bg-black text-white',
        arrow: 'bg-black border-black',
      }}
    >
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
    </Tooltip>
  );
}
