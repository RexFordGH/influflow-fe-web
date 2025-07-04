'use client';

import { useGenerateImage } from '@/lib/api/services';
import {
  type ImageConversationItem,
  type ImageEditProps,
} from '@/types/content';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-start z-50">
      {/* 左半边覆盖层 - 覆盖思维导图区域 */}
      <div className="w-1/2 h-full bg-white shadow-2xl flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div></div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 对话历史区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* 用户提示词 */}
              <div className="flex justify-end">
                <div className="max-w-xs bg-blue-600 text-white rounded-lg px-4 py-2">
                  <p className="text-sm">{item.prompt}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* AI 生成的图片 */}
              <div className="flex justify-start">
                <div className="max-w-sm bg-gray-100 rounded-lg p-3">
                  <div className="relative">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {item.isApplied && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Apply 按钮 */}
                  {!item.isApplied && (
                    <button
                      onClick={() => handleApplyImage(item)}
                      className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Apply
                    </button>
                  )}

                  {item.isApplied && (
                    <div className="w-full mt-3 bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm font-medium text-center">
                      ✓ Applied
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 生成中状态 */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-sm bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Generating image...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-[10px] justify-between items-center">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                placeholder="Enter image generation prompt, e.g. a futuristic AI robot..."
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右半边点击关闭 */}
      <div className="w-1/2 h-full" onClick={onClose} />
    </div>
  );
}
