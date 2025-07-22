'use client';

import { TweetData } from '@/types/tweets';
import { useEffect, useRef, useState } from 'react';

interface UseTweetHoverProps {
  topicTitle: string;
  hoverDelay?: number;
  leaveDelay?: number;
}

export function useTweetHover({
  topicTitle,
  hoverDelay = 500,
  leaveDelay = 300,
}: UseTweetHoverProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimeouts = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  // 处理鼠标进入
  const handleMouseEnter = () => {
    console.log('🔥 Mouse enter event triggered for:', topicTitle);
    clearTimeouts();
    setIsHovering(true);

    // 延迟显示 modal
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout reached, opening modal for:', topicTitle);
      console.log('🔄 Setting isModalOpen to true...');
      if (!tweets.length) {
        console.log('📥 Loading tweets...');
        loadTweets();
      }
      setIsModalOpen(true);
      console.log('✅ setIsModalOpen(true) called');
    }, hoverDelay);
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    clearTimeouts();
    setIsHovering(false);

    // 延迟关闭 modal
    leaveTimeoutRef.current = setTimeout(() => {
      setIsModalOpen(false);
    }, leaveDelay);
  };

  // 处理 modal 鼠标进入（保持打开状态）
  const handleModalMouseEnter = () => {
    clearTimeouts();
  };

  // 处理 modal 鼠标离开
  const handleModalMouseLeave = () => {
    setIsModalOpen(false);
  };

  // 加载推文数据
  const loadTweets = async () => {
    if (!topicTitle) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO fetchTweetsForTopic
      // const topicTweets = await fetchTweetsForTopic(topicTitle);
      // if (topicTweets) {
      //   setTweets(topicTweets.tweets);
      // } else {
      //   setError('No tweets found for this topic');
      // }
    } catch (err) {
      setError('Failed to load tweets');
      console.error('Error loading tweets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理选择推文
  const handleConfirm = (selectedTweets: TweetData[]) => {
    console.log('Selected tweets:', selectedTweets);
    // 这里可以添加实际的选择逻辑，比如复制到剪贴板、添加到收藏等
    setIsModalOpen(false);
  };

  // 强制关闭 modal
  const closeModal = () => {
    clearTimeouts();
    setIsModalOpen(false);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);

  return {
    isModalOpen,
    tweets,
    isLoading,
    error,
    handleMouseEnter,
    handleMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleConfirm,
    closeModal,
  };
}
