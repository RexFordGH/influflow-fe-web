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
      <div className="shrink-0 bg-[#f7f7f7] py-3">
        <div className="flex h-full items-center justify-between">
          <div className="ml-3 flex items-center">
            <Button
              size="sm"
              variant="light"
              onPress={onBack}
              className="rounded-[12px] text-black"
              startContent={
                <ChevronLeftIcon className="size-4 stroke-[2.5] text-black" />
              }
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
                    // 关闭ChatDialog
                    window.dispatchEvent(new CustomEvent('closeChatDialog'));
                    // 触发mindmapOverlayState事件，将isMindmapOverlayOpen设置为false
                    window.dispatchEvent(
                      new CustomEvent('mindmapOverlayState', {
                        detail: { open: false },
                      }),
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
            ) : null}
          </div>
          <div className="mr-3 flex items-center space-x-3">
            {/* 如果是 longform 模式，显示复制全文按钮 */}
            {isLongformType(contentFormat) && (
              <Button
                size="sm"
                variant="light"
                onPress={onCopyFullContent}
                isLoading={isCopyingFullContent}
                disabled={isCopyingFullContent || isGenerating}
                className="rounded-[12px] bg-[#F0F0F0]"
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
              className="rounded-[12px] bg-[#448AFF] text-white hover:bg-[#1991DB]"
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
