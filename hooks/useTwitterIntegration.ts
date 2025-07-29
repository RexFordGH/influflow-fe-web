import { useCallback, useState } from 'react';
import { addToast } from '@/components/base/toast';
import {
  getErrorMessage,
  useCheckTwitterAuthStatus,
  usePostToTwitter,
  type TwitterPostRequest,
  type TwitterTweetData,
} from '@/lib/api/services';
import { Outline } from '@/types/outline';
import { convertToTwitterFormat, copyTwitterContent } from '@/utils/twitter';
import { getEmojiNumber } from '@/utils/markdownUtils';

interface CollectedImage {
  src: string;
  alt: string;
  originalSectionId: string;
  tweetId?: string;
}

interface UseTwitterIntegrationProps {
  rawAPIData: Outline | null;
  collectedImages?: CollectedImage[];
}

interface UseTwitterIntegrationReturn {
  // 状态
  isPostingToTwitter: boolean;
  twitterAuthStatus: any;
  isCopyingFullContent: boolean;
  
  // 方法
  handlePostToTwitter: () => Promise<void>;
  handleCopyFullContent: () => Promise<void>;
  refetchTwitterAuthStatus: () => void;
  checkTwitterAuth: () => boolean;
}

export function useTwitterIntegration({
  rawAPIData,
  collectedImages = []
}: UseTwitterIntegrationProps): UseTwitterIntegrationReturn {
  const [isPostingToTwitter, setIsPostingToTwitter] = useState(false);
  const [isCopyingFullContent, setIsCopyingFullContent] = useState(false);
  
  // 使用现有的 Twitter auth hook
  const { data: twitterAuthStatus, refetch: refetchTwitterAuthStatus } = 
    useCheckTwitterAuthStatus();
  
  // 使用 Twitter 发布 hook
  const postToTwitterMutation = usePostToTwitter();
  
  // 检查认证状态
  const checkTwitterAuth = useCallback(() => {
    return twitterAuthStatus?.authorized ?? false;
  }, [twitterAuthStatus]);
  
  // Twitter发布逻辑
  const handlePostToTwitter = useCallback(async () => {
    addToast({
      title: 'One-click tweet coming soon!',
      color: 'warning',
      timeout: 5000,
    });
    
    if (!rawAPIData) {
      addToast({
        title: '没有可发布的内容',
        color: 'warning',
      });
      return;
    }
    
    setIsPostingToTwitter(true);
    
    try {
      // 构建推文数据
      const tweets: TwitterTweetData[] = rawAPIData.nodes
        .flatMap((group: any) => group.tweets)
        .map((tweet: any, index: number) => {
          const totalTweets = rawAPIData.nodes.reduce(
            (total: number, g: any) => total + g.tweets.length,
            0,
          );
          const tweetNumber = index + 1;
          const content = tweet.content || tweet.title || '';
          const text = `${tweetNumber}/${totalTweets}\n\n${content}`;
          
          const tweetData: TwitterTweetData = { text };
          
          // 如果推文有图片，添加图片URL
          if (tweet.image_url) {
            tweetData.image_url = tweet.image_url;
          }
          
          return tweetData;
        });
      
      const postRequest: TwitterPostRequest = {
        tweets,
        delay_seconds: 1, // 推文间隔1秒
      };
      
      // 后端暂时不用，发请求用于后端打 log
      postToTwitterMutation.mutateAsync(postRequest);
      
    } catch (error) {
      console.error('Twitter发布失败:', error);
      addToast({
        title: '发布失败',
        description: getErrorMessage(error),
        color: 'danger',
      });
    } finally {
      setIsPostingToTwitter(false);
    }
  }, [rawAPIData, postToTwitterMutation]);
  
  // 处理复制全文内容
  const handleCopyFullContent = useCallback(async () => {
    if (!rawAPIData) return;
    
    setIsCopyingFullContent(true);
    
    try {
      // 格式化各部分内容
      const contentParts: string[] = [];
      if (rawAPIData.topic) {
        contentParts.push(convertToTwitterFormat(rawAPIData.topic));
      }
      
      // 根据 content_format 决定处理方式
      if (rawAPIData.content_format === 'longform') {
        // longform 模式：不展示第一个小标题，序号从第二个小标题开始
        let globalTweetIndex = 0;
        
        rawAPIData.nodes.forEach((group: any) => {
          group.tweets.forEach((tweet: any) => {
            // 第一个小标题不展示
            if (globalTweetIndex > 0 && tweet.title) {
              // 从第二个标题开始显示 emoji 数字（1️⃣、2️⃣...）
              const emojiNumber = getEmojiNumber(globalTweetIndex - 1);
              const titleWithEmoji = `${emojiNumber} ${tweet.title}`;
              contentParts.push(convertToTwitterFormat(titleWithEmoji));
            }
            
            // 始终添加内容
            if (tweet.content) {
              contentParts.push(convertToTwitterFormat(tweet.content));
            }
            
            globalTweetIndex++;
          });
        });
      } else {
        // 其他格式（thread 等）：保持原有逻辑
        rawAPIData.nodes.forEach((group: any, groupIndex: number) => {
          if (group.title) {
            const emojiNumber = getEmojiNumber(groupIndex);
            const titleWithEmoji = `${emojiNumber} ${group.title}`;
            contentParts.push(convertToTwitterFormat(titleWithEmoji));
          }
          group.tweets.forEach((tweet: any) => {
            if (tweet.content || tweet.title) {
              contentParts.push(
                convertToTwitterFormat(tweet.content || tweet.title),
              );
            }
          });
        });
      }
      
      // 合并预格式化的部分
      const fullContent = contentParts.join('\n\n');
      
      // 获取第一张图片的URL（如果有）
      const firstImageUrl =
        collectedImages.length > 0 ? collectedImages[0].src : undefined;
      
      // 调用现有的 copyTwitterContent 函数
      // 该函数处理文本格式化、图片获取、PNG 转换和剪贴板写入
      await copyTwitterContent(fullContent, firstImageUrl);
    } catch (error) {
      // 错误已由 copyTwitterContent 处理，这里仅记录
      console.error('Error during copy operation:', error);
    } finally {
      setIsCopyingFullContent(false);
    }
  }, [rawAPIData, collectedImages]);
  
  return {
    // 状态
    isPostingToTwitter,
    twitterAuthStatus,
    isCopyingFullContent,
    
    // 方法
    handlePostToTwitter,
    handleCopyFullContent,
    refetchTwitterAuthStatus,
    checkTwitterAuth,
  };
}