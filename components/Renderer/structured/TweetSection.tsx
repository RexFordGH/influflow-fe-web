'use client';

import EditorPro from '@/components/editorPro';
import { ImageLoadingAnimation } from '@/components/ui/ImageLoadingAnimation';
import { TweetContentItem } from '@/types/outline';
import { cn } from '@heroui/react';
import { useCallback, useState } from 'react';
import { LocalImageUploader } from '../markdown/LocalImageUploader';
import { markdownStyles } from '../markdown/markdownStyles';
import {
  CopyButton,
  EditWithAIButton,
  TweetImageButton,
} from '../markdown/SectionRenderer';

interface TweetSectionProps {
  tweet: TweetContentItem;
  groupIndex: number;
  tweetIndex: number;
  tweetNumber: number;
  totalTweets: number;
  isHighlighted?: boolean;
  isLoading?: boolean;
  isGeneratingImage?: boolean;
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
  onEditWithAI?: (nodeId: string) => void;
  onDeleteImage?: (image: any) => void;
  editingNodeId?: string | null;
  localImageUrls?: Record<string, string>;
  tweetData?: any;
  setSectionRef?: (sectionId: string, element: HTMLDivElement | null) => void;
}

export function TweetSection({
  tweet,
  groupIndex,
  tweetIndex,
  tweetNumber,
  totalTweets,
  isHighlighted = false,
  isLoading = false,
  isGeneratingImage = false,
  onSectionHover,
  onImageClick,
  onTweetImageEdit,
  onTweetContentChange,
  onLocalImageUploadSuccess,
  onImageSelect,
  onDirectGenerate,
  onEditWithAI,
  onDeleteImage,
  editingNodeId,
  localImageUrls,
  tweetData,
  setSectionRef,
}: TweetSectionProps) {
  const sectionId = `tweet-${tweet.tweet_number}`;
  const [currentEditorContent, setCurrentEditorContent] = useState(
    tweet.content,
  );

  const handleMouseEnter = useCallback(() => {
    onSectionHover?.(tweet.tweet_number.toString());
  }, [onSectionHover, tweet.tweet_number]);

  const handleMouseLeave = useCallback(() => {
    onSectionHover?.(null);
  }, [onSectionHover]);

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
        onTweetContentChange?.(tweet.tweet_number.toString(), plainText);
      } catch (e) {
        console.error('Failed to parse editor content:', e);
      }
    },
    [tweet.tweet_number, onTweetContentChange],
  );

  const baseClasses = markdownStyles.sections.tweet.base;
  const highlightClasses = isHighlighted
    ? markdownStyles.sections.tweet.highlighted
    : '';
  const loadingClasses = isLoading ? markdownStyles.sections.tweet.loading : '';

  // 获取当前tweet的完整数据
  const currentTweetData = tweetData?.nodes
    ?.flatMap((group: any) => group.tweets)
    ?.find(
      (t: any) => t.tweet_number.toString() === tweet.tweet_number.toString(),
    );

  // 获取图片URL
  const imageUri =
    localImageUrls?.[tweet.tweet_number.toString()] ||
    currentTweetData?.image_url ||
    tweet.image_url;

  // 组合标题和内容用于编辑器
  const editorValue = JSON.stringify({
    content: tweet.content,
    type: 'doc',
    isEmpty: tweet.content.trim(),
  });

  return (
    <div
      ref={(el) => setSectionRef?.(sectionId, el)}
      className={cn(
        baseClasses,
        highlightClasses,
        loadingClasses,
        'group relative border border-gray-100',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

      {/* 内容编辑器 - 包含标题和内容 */}
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
              'prose prose-sm [&_.tiptap]:leading-[1.7] max-w-none bg-transparent text-black [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[6px] [&_.tiptap]:text-[15px] [&_.tiptap]:font-[500] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-0',
          }}
        />
      </div>

      {/* 生成图片loading状态 */}
      {isGeneratingImage && (
        <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
          <ImageLoadingAnimation size={160} />
          <span className="text-sm text-gray-500">Generating image...</span>
        </div>
      )}

      {/* 图片展示 */}
      {!isGeneratingImage && imageUri && (
        <div className="group relative my-4 flex justify-center">
          <img
            src={imageUri}
            alt={tweet.title}
            className="max-h-[400px] w-auto cursor-pointer rounded-lg object-cover shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            onClick={() =>
              onImageClick?.({
                url: imageUri,
                alt: tweet.title,
              })
            }
          />
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => {
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
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 - 绝对定位在右上角 */}
      <div
        className={`absolute right-[4px] top-[4px] flex items-center justify-end gap-1 transition-opacity ${
          editingNodeId &&
          (tweet.tweet_number.toString() === editingNodeId ||
            editingNodeId === sectionId)
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <EditWithAIButton
          nodeId={tweet.tweet_number.toString()}
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
}
