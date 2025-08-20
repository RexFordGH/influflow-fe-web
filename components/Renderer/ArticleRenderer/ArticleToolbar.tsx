import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Tooltip } from '@heroui/react';
import React, { useEffect, useState } from 'react';

import { IContentFormat } from '@/types/api';
import { isLongformType } from '@/utils/contentFormat';

interface ArticleToolbarProps {
  topic: string;
  contentFormat: IContentFormat;
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

export const ArticleToolbar: React.FC<ArticleToolbarProps> = React.memo(
  ({
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
    onPostToTwitter,
  }) => {
    const [isMindmapOverlayOpen, setIsMindmapOverlayOpen] = useState(false);

    // 监听MindmapOverlay的打开/关闭状态
    useEffect(() => {
      const handler = (e: Event) => {
        const custom = e as CustomEvent<{ open: boolean }>;
        if (custom?.detail && typeof custom.detail.open === 'boolean') {
          setIsMindmapOverlayOpen(custom.detail.open);
        }
      };
      window.addEventListener('mindmapOverlayState', handler as EventListener);
      return () =>
        window.removeEventListener(
          'mindmapOverlayState',
          handler as EventListener,
        );
    }, []);

    return (
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-[4px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              variant="light"
              onPress={onBack}
              className="text-gray-500"
              startContent={<ChevronLeftIcon className="size-4 font-bold !text-black" />}
            >
              Back
            </Button>

            {/* 用于打开/关闭Mindmap的按钮 */}
            {isMindmapOverlayOpen ? (
              <Tooltip content="Mind Map" showArrow={true} color="foreground">
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  onPress={() => {
                    window.dispatchEvent(
                      new CustomEvent('closeMindmapOverlay'),
                    );
                  }}
                  className={`duration-20 flex size-8 min-w-1 items-center justify-center rounded-md p-0 transition-colors hover:bg-[#EFEFEF]`}
                  style={{
                    marginLeft: '0px',
                  }}
                >
                  <img
                    src="/icons/mindmap.svg"
                    alt="mindmap"
                    className="size-4"
                  />
                </Button>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                color="primary"
                variant="solid"
                onPress={() => {
                  // 通过自定义事件通知 Mindmap 打开 Prompt History
                  window.dispatchEvent(new CustomEvent('openPromptHistory'));
                }}
                className={`duration-20 flex h-8 min-w-1 items-center rounded-md px-2 text-gray-500 transition-colors hover:bg-[#EFEFEF]`}
                style={{
                  marginLeft: '0px',
                }}
                startContent={
                  <img
                    src="/icons/vector.svg"
                    alt="Prompt History"
                    className="pointer-events-none size-3 opacity-60"
                  />
                }
              >
                Prompts
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* 如果是 longform 模式，显示复制全文按钮 */}
            {isLongformType(contentFormat) && (
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
              className="bg-[#4285f4] text-white hover:bg-[#1991DB]"
            >
              {isPostingToTwitter ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

ArticleToolbar.displayName = 'ArticleToolbar';
