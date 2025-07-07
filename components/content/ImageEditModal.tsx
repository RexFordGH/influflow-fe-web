'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Image, Tooltip } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useGenerateImage } from '@/lib/api/services';
import {
  type ImageConversationItem,
  type ImageEditProps,
} from '@/types/content';

// 新增：图片放大器模态框组件
function ImageViewerModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300"
      onClick={onClose} // 点击背景关闭
    >
      <div className="relative max-h-[90vh] max-w-4xl p-4">
        <img
          src={imageUrl}
          alt="Magnified view"
          className="size-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()} // 防止点击图片自身导致关闭
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
        >
          <XMarkIcon className="size-6" />
        </button>
      </div>
    </div>
  );
}

// 子组件：用于渲染和管理单个图片气泡的加载状态
function ImageBubble({
  item,
  onApply,
  onMagnify, // 新增：点击放大图片的回调
}: {
  item: ImageConversationItem;
  onApply: (item: ImageConversationItem) => void;
  onMagnify: (url: string) => void;
}) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="flex items-end justify-start gap-[12px]">
      <div className="relative h-auto min-h-[180px] w-[320px]">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100">
            <div className="size-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
          </div>
        )}
        <Image
          src={item.imageUrl}
          alt={item.prompt}
          width={320}
          className={`h-auto cursor-pointer rounded-[12px] object-cover transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)} // 加载失败也应移除loading
          onClick={() => onMagnify(item.imageUrl)} // 点击图片时调用放大回调
        />
      </div>

      <div
        onClick={() => onApply(item)}
        className="cursor-pointer hover:opacity-70"
      >
        <Tooltip
          content="Apply"
          delay={50}
          closeDelay={0}
          placement="top"
          classNames={{
            content: 'bg-black text-white',
            arrow: 'bg-black border-black',
          }}
        >
          <Image src="/icons/apply.svg" alt="apply" width={32} height={32} />
        </Tooltip>
      </div>
    </div>
  );
}

export function ImageEditModal({
  image,
  targetTweet,
  tweetThread,
  onImageUpdate,
  onClose,
}: ImageEditProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversation, setConversation] = useState<ImageConversationItem[]>(
    () => {
      if (image.url) {
        return [
          {
            id: 'original',
            prompt: image.prompt || '原始图片',
            imageUrl: image.url,
            timestamp: Date.now() - 1000,
            isApplied: true,
          },
        ];
      }
      return [];
    },
  );
  const [magnifiedImageUrl, setMagnifiedImageUrl] = useState<string | null>(
    null,
  ); // 新增：用于放大图片的状态
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateImageMutation = useGenerateImage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAutoGenerateImage = useCallback(async () => {
    if (!targetTweet || !targetTweet.trim() || isGenerating) return;

    const currentPrompt = targetTweet.trim();
    const newItemId = `auto-generating-${Date.now()}`;

    setConversation([
      {
        id: newItemId,
        prompt: currentPrompt,
        imageUrl: '',
        timestamp: Date.now(),
        isApplied: false,
        isLoading: true,
      },
    ]);

    setIsGenerating(true);

    try {
      const imageUrl = await generateImageMutation.mutateAsync({
        target_tweet: currentPrompt,
        tweet_thread: tweetThread,
      });

      setConversation([
        {
          id: newItemId,
          prompt: currentPrompt,
          imageUrl: imageUrl,
          timestamp: Date.now(),
          isApplied: false,
          isLoading: false,
        },
      ]);
    } catch (error) {
      console.error('自动生成图片失败:', error);
      setConversation([]);
    } finally {
      setIsGenerating(false);
    }
  }, [targetTweet, isGenerating, tweetThread, generateImageMutation]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // 自动生成图片的逻辑
  useEffect(() => {
    // 检查是否没有图片并且有targetTweet内容
    if (
      !image.url &&
      targetTweet &&
      targetTweet.trim() &&
      conversation.length === 0
    ) {
      handleAutoGenerateImage();
    }
  }, [image.url, targetTweet, conversation.length, handleAutoGenerateImage]);

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    const currentPrompt = prompt.trim();
    const newItemId = `generating-${Date.now()}`;

    setConversation((prev) => [
      ...prev,
      {
        id: newItemId,
        prompt: currentPrompt,
        imageUrl: '',
        timestamp: Date.now(),
        isApplied: false,
        isLoading: true,
      },
    ]);

    setPrompt('');
    setIsGenerating(true);

    try {
      const imageUrl = await generateImageMutation.mutateAsync({
        target_tweet: currentPrompt,
        tweet_thread: tweetThread,
      });

      setConversation((prev) =>
        prev.map((item) =>
          item.id === newItemId
            ? { ...item, imageUrl: imageUrl, isLoading: false }
            : item,
        ),
      );
    } catch (error) {
      console.error('生成图片失败:', error);
      setConversation((prev) => prev.filter((item) => item.id !== newItemId));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyImage = (item: ImageConversationItem) => {
    onImageUpdate({
      url: item.imageUrl,
      alt: item.prompt,
      caption: item.prompt,
      prompt: item.prompt,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-transparent bg-opacity-50">
      <div className="flex h-full w-1/2 flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <div></div>
          <button
            onClick={onClose} // 只有这个按钮可以关闭
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <XMarkIcon className="size-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {conversation.map((item) => (
            <div key={item.id} className="space-y-[24px]">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-lg bg-[#E8E8E8] px-[12px] py-[8px] text-black">
                  <p className="text-sm">{item.prompt}</p>
                </div>
              </div>

              {item.isLoading ? (
                <div className="flex items-end justify-start gap-[12px]">
                  <div className="relative h-auto min-h-[180px] w-[320px]">
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100">
                      <div className="size-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                      <span className="ml-2 text-sm text-gray-600">
                        Generating...
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <ImageBubble
                  item={item}
                  onApply={handleApplyImage}
                  onMagnify={setMagnifiedImageUrl} // 传递放大函数
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-[48px]">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-4 pr-12 text-gray-700 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-1"
                rows={4}
                placeholder="Please limit to 300 words."
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右半边空白区域，不再有关闭功能 */}
      <div className="h-full w-1/2" />

      {/* 图片放大器 */}
      {magnifiedImageUrl && (
        <ImageViewerModal
          imageUrl={magnifiedImageUrl}
          onClose={() => setMagnifiedImageUrl(null)}
        />
      )}
    </div>
  );
}
