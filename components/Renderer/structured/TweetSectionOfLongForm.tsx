'use client';

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@heroui/react';
import EditorPro from '@/components/editorPro';
import { ImageLoadingAnimation } from '@/components/ui/ImageLoadingAnimation';
import { markdownStyles } from '../markdown/markdownStyles';
import { LocalImageUploader } from '../markdown/LocalImageUploader';
import { TweetImageButton, EditWithAIButton } from '../markdown/SectionRenderer';
import { TweetContentItem } from '@/types/outline';

interface TweetSectionOfLongFormProps {
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

export function TweetSectionOfLongForm({
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
}: TweetSectionOfLongFormProps) {
  const sectionId = `tweet-${tweet.tweet_number}`;
  const [currentEditorContent, setCurrentEditorContent] = useState('');

  // 初始化编辑器内容 - 移除标题，只保留内容
  useEffect(() => {
    // 从内容中移除标题部分
    const contentWithoutTitle = tweet.content.replace(tweet.title, '').trim();
    setCurrentEditorContent(contentWithoutTitle);
  }, [tweet.content, tweet.title]);

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

  // 处理内容 - 移除标题
  const tweetContent = currentEditorContent || tweet.content.replace(tweet.title, '').trim();

  const editorValue = JSON.stringify({
    content: tweetContent,
    type: 'doc',
    isEmpty: !tweetContent.trim(),
  });

  return (
    <div
      ref={(el) => setSectionRef?.(sectionId, el)}
      className={cn(
        baseClasses, 
        highlightClasses, 
        loadingClasses, 
        'group relative !mt-[16px] !scale-100 border-none !py-[4px] px-[8px] pb-0'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoading && (
        <div className="absolute left-2 top-2">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* 内容编辑器 - 只显示内容，不显示标题 */}
      {tweetContent && (
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
                'prose prose-sm [&_.tiptap]:leading-[1.7] max-w-none bg-transparent text-black [&_.tiptap]:min-h-0 [&_.tiptap]:bg-transparent [&_.tiptap]:p-[2px] [&_.tiptap]:text-[13px] [&_.tiptap]:font-[500]',
            }}
          />
        </div>
      )}

      {/* 生成图片loading状态 */}
      {isGeneratingImage && (
        <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
          <ImageLoadingAnimation size={160} />
          <span className="text-sm text-gray-500">Generating image...</span>
        </div>
      )}

      {/* 操作按钮 - 绝对定位在右上方 */}
      <div 
        className={`absolute right-[4px] top-[-28px] flex items-center justify-end gap-1 transition-opacity ${
          editingNodeId &&
          ((tweet.tweet_number.toString() === editingNodeId) ||
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
      </div>
    </div>
  );
}