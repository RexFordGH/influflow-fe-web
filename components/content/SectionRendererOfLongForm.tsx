'use client';

import { Image } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';

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
import {
  CopyButton,
  SectionRendererProps,
  TweetImageButton,
} from './SectionRenderer';

export function SectionRendererOfLongForm({
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
          className={`${baseClasses} ${loadingClasses} border-none pt-[24px]`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {isLoading && (
            <div className="absolute left-2 top-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          {/* TODO: 长推不需要序号 */}
          {/* {totalTweets > 0 && tweetNumber > 0 && (
            <div className="text-[10px] font-medium text-black/60">
              ({tweetNumber}/{totalTweets})
            </div>
          )} */}

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
                className="max-h-[400px] w-auto cursor-pointer rounded-lg object-cover shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
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
