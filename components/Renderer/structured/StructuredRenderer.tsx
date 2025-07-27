'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Outline } from '@/types/outline';
import { cn } from '@heroui/react';
import { markdownStyles } from '../markdown/markdownStyles';
import { GroupSection } from './GroupSection';
import { TweetSection } from './TweetSection';
import { GroupSectionOfLongForm } from './GroupSectionOfLongForm';
import { TweetSectionOfLongForm } from './TweetSectionOfLongForm';

interface StructuredRendererProps {
  data: Outline;
  onSectionHover?: (sectionId: string | null) => void;
  onSourceClick?: (sectionId: string) => void;
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
  onEditWithAI?: (nodeId: string) => void;
  highlightedSection?: string | null;
  hoveredTweetId?: string | null;
  selectedNodeId?: string | null;
  editingNodeId?: string | null;
  loadingTweetId?: string | null;
  generatingImageTweetIds?: string[];
  localImageUrls?: Record<string, string>;
  imageData?: {
    url: string;
    alt: string;
    caption?: string;
    prompt?: string;
  };
  tweetData?: any;
  scrollToSection?: string | null;
  collectedImages?: any[];
  onDeleteImage?: (image: any) => void;
}

export function StructuredRenderer({
  data,
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
}: StructuredRendererProps) {
  // 创建refs映射
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

  // 滚动到指定section
  const scrollToSectionById = useCallback((sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  // 监听scrollToSection变化
  useEffect(() => {
    if (scrollToSection) {
      // 支持多种格式的ID
      const targetId = scrollToSection.startsWith('group-') 
        ? scrollToSection 
        : scrollToSection.startsWith('tweet-')
        ? scrollToSection
        : `tweet-${scrollToSection}`;
      
      setTimeout(() => scrollToSectionById(targetId), 100);
    }
  }, [scrollToSection, scrollToSectionById]);

  // 计算所有tweets的总数（用于显示序号）
  const totalTweets = useMemo(() => {
    return data.nodes.reduce((sum, group) => sum + group.tweets.length, 0);
  }, [data.nodes]);

  // 根据 content_format 选择组件
  const isLongForm = tweetData?.content_format === 'longform';
  const GroupComponent = isLongForm ? GroupSectionOfLongForm : GroupSection;
  const TweetComponent = isLongForm ? TweetSectionOfLongForm : TweetSection;

  return (
    <div
      className={cn(
        markdownStyles.container.main,
        editingNodeId ? 'pb-[300px]' : '',
      )}
    >
      <div className={markdownStyles.container.content}>
        <div className={markdownStyles.container.sections}>
          {data.nodes.map((group, groupIndex) => (
            <GroupComponent
              key={`group-${groupIndex}`}
              group={group}
              groupIndex={groupIndex}
              isHighlighted={
                highlightedSection === `group-${groupIndex}` ||
                hoveredTweetId === `group-${groupIndex}` ||
                editingNodeId === `group-${groupIndex}`
              }
              isLoading={loadingTweetId === `group-${groupIndex}`}
              onSectionHover={onSectionHover}
              onGroupTitleChange={onGroupTitleChange}
              editingNodeId={editingNodeId}
              setSectionRef={setSectionRef}
            >
              {group.tweets.map((tweet, tweetIndex) => {
                const tweetNumber = data.nodes
                  .slice(0, groupIndex)
                  .reduce((sum, g) => sum + g.tweets.length, 0) + tweetIndex + 1;

                return (
                  <TweetComponent
                    key={`tweet-${tweet.tweet_number}`}
                    tweet={tweet}
                    groupIndex={groupIndex}
                    tweetIndex={tweetIndex}
                    tweetNumber={tweetNumber}
                    totalTweets={totalTweets}
                    isHighlighted={
                      highlightedSection === `tweet-${tweet.tweet_number}` ||
                      hoveredTweetId === tweet.tweet_number.toString() ||
                      selectedNodeId === tweet.tweet_number.toString() ||
                      editingNodeId === tweet.tweet_number.toString() ||
                      (generatingImageTweetIds?.includes(tweet.tweet_number.toString()) ?? false)
                    }
                    isLoading={loadingTweetId === tweet.tweet_number.toString()}
                    isGeneratingImage={generatingImageTweetIds?.includes(tweet.tweet_number.toString()) ?? false}
                    onSectionHover={onSectionHover}
                    onImageClick={onImageClick}
                    onTweetImageEdit={onTweetImageEdit}
                    onTweetContentChange={onTweetContentChange}
                    onLocalImageUploadSuccess={onLocalImageUploadSuccess}
                    onImageSelect={onImageSelect}
                    onDirectGenerate={onDirectGenerate}
                    onEditWithAI={onEditWithAI}
                    onDeleteImage={onDeleteImage}
                    editingNodeId={editingNodeId}
                    localImageUrls={localImageUrls}
                    tweetData={tweetData}
                    setSectionRef={setSectionRef}
                  />
                );
              })}
            </GroupComponent>
          ))}
        </div>

        {/* 图片画廊 - 仅在 longform 模式下显示 */}
        {tweetData?.content_format === 'longform' &&
          collectedImages.length > 0 && (
            <div className="mt-[48px] flex flex-col justify-center gap-[16px]">
              {collectedImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative flex aspect-video h-[400px] justify-center"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-[400px] w-auto rounded-lg object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute right-1.5 top-1.5 z-20 flex items-center justify-end gap-1">
                    {/* 复制和删除按钮的逻辑与原始版本相同 */}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}