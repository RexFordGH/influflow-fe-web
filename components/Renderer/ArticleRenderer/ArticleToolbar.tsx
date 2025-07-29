import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';

import { ContentFormat } from '@/types/api';

interface ArticleToolbarProps {
  topic: string;
  contentFormat: ContentFormat;
  isGenerating: boolean;
  isRegenerating: boolean;
  isPostingToTwitter: boolean;
  isCopyingFullContent: boolean;
  hasTwitterAuth: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onCopyFullContent: () => void;
  onPostToTwitter: () => void;
}

export const ArticleToolbar: React.FC<ArticleToolbarProps> = React.memo(({
  topic,
  contentFormat,
  isGenerating,
  isRegenerating,
  isPostingToTwitter,
  isCopyingFullContent,
  hasTwitterAuth,
  onBack,
  onRegenerate,
  onCopyFullContent,
  onPostToTwitter
}) => {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-[4px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="light"
            onPress={onBack}
            className="text-gray-600"
            startContent={<ChevronLeftIcon className="size-4" />}
          >
            Back
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {/* 如果是 longform 模式，显示复制全文按钮 */}
          {contentFormat === 'longform' && (
            <Button
              size="sm"
              variant="light"
              onPress={onCopyFullContent}
              isLoading={isCopyingFullContent}
              disabled={isCopyingFullContent || isGenerating}
              className="bg-black/15"
            >
              Copy
            </Button>
          )}
          <Button
            size="sm"
            color="primary"
            onPress={onPostToTwitter}
            isLoading={isPostingToTwitter}
            disabled={isPostingToTwitter || isGenerating}
            className="bg-[#1DA1F2] text-white hover:bg-[#1991DB]"
          >
            {isPostingToTwitter ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
});

ArticleToolbar.displayName = 'ArticleToolbar';