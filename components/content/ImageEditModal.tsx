'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

import { useGenerateImage } from '@/lib/api/services';
import {
  type ImageConversationItem,
  type ImageEditProps,
} from '@/types/content';
import { Image, Tooltip } from '@heroui/react';

export function ImageEditModal({
  image,
  targetTweet,
  tweetThread,
  onImageUpdate,
  onClose,
}: ImageEditProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversation, setConversation] = useState<ImageConversationItem[]>([
    // 初始化时添加原始图片作为第一个对话项
    {
      id: 'original',
      prompt: image.prompt || '原始图片',
      imageUrl: image.url,
      timestamp: Date.now() - 1000,
      isApplied: true,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateImageMutation = useGenerateImage();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const currentPrompt = prompt.trim();
    setPrompt(''); // 清空输入框

    try {
      const imageUrl = await generateImageMutation.mutateAsync({
        target_tweet: targetTweet,
        tweet_thread: tweetThread + `\n\n图片生成提示词: ${currentPrompt}`,
      });

      // 添加新的对话项
      const newItem: ImageConversationItem = {
        id: `generated-${Date.now()}`,
        prompt: currentPrompt,
        imageUrl: imageUrl,
        timestamp: Date.now(),
        isApplied: false,
      };

      setConversation((prev) => [...prev, newItem]);
    } catch (error) {
      console.error('生成图片失败:', error);
      // 这里可以添加错误提示
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyImage = (item: ImageConversationItem) => {
    // 更新所有项目的应用状态
    setConversation((prev) =>
      prev.map((convItem) => ({
        ...convItem,
        isApplied: convItem.id === item.id,
      })),
    );

    // 应用图片
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
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black bg-opacity-50">
      {/* 左半边覆盖层 - 覆盖思维导图区域 */}
      <div className="flex h-full w-1/2 flex-col bg-white shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4">
          <div></div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <XMarkIcon className="size-5 text-gray-500" />
          </button>
        </div>

        {/* 对话历史区域 */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {conversation.map((item) => (
            <div key={item.id} className="space-y-[24px]">
              {/* 用户提示词 */}
              <div className="flex justify-end">
                <div className="max-w-xs rounded-lg bg-[#E8E8E8] px-[12px] py-[8px] text-black">
                  <p className="text-sm">{item.prompt}</p>
                </div>
              </div>

              {/* AI 生成的图片 */}
              <div className="flex justify-start items-end gap-[12px]">
                <Image
                  src={item.imageUrl}
                  alt={item.prompt}
                  width={320}
                  className="h-auto rounded-[12px] object-cover"
                />

                <div
                  onClick={() => handleApplyImage(item)}
                  className="hover:opacity-70 cursor-pointer"
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
                    <Image
                      src="/icons/apply.svg"
                      alt="apply"
                      width={32}
                      height={32}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}

          {/* 生成中状态 */}
          {isGenerating && (
            <div className="flex justify-center items-center space-x-3 size-[320px] rounded-lg bg-gray-100 p-3">
              <div className="size-5 animate-spin rounded-full border-2 border-black-500 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Generating image...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
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

      {/* 右半边点击关闭 */}
      <div className="h-full w-1/2" onClick={onClose} />
    </div>
  );
}
