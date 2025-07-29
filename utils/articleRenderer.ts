import { Outline, TweetContentItem } from '@/types/outline';
import { MindmapNodeData } from '@/types/content';

// 解析 topic 中的参考推文
export function parseTopicWithReferences(topic: string): {
  userInput: string;
  referenceUrls: string[];
} {
  let userInput = topic.trim();
  let referenceUrls: string[] = [];
  
  // 检查是否包含参考推文的格式
  const referenceMatch = userInput.match(
    /\.\s*Reference these popular posts:\s*(.+)$/,
  );
  if (referenceMatch) {
    // 提取纯净的topic（不包含参考推文部分）
    userInput = userInput.replace(referenceMatch[0], '').trim();
    // 提取参考推文URL列表
    referenceUrls = referenceMatch[1].split(',').map((url) => url.trim());
  }
  
  return {
    userInput,
    referenceUrls
  };
}

// 更新 Outline 中的 tweet 内容
export function updateTweetInOutline(
  outline: Outline,
  tweetNumber: number,
  updates: Partial<TweetContentItem>
): Outline {
  const updatedNodes = outline.nodes.map((group) => ({
    ...group,
    tweets: group.tweets.map((tweet) =>
      tweet.tweet_number === tweetNumber
        ? { ...tweet, ...updates }
        : tweet
    ),
  }));
  
  return {
    ...outline,
    nodes: updatedNodes
  };
}

// 更新 Outline 中的图片URL
export function updateImageInOutline(
  outline: Outline,
  tweetNumber: number,
  imageUrl: string | null
): Outline {
  const updatedNodes = outline.nodes.map((group) => ({
    ...group,
    tweets: group.tweets.map((tweet) =>
      tweet.tweet_number === tweetNumber
        ? { ...tweet, image_url: imageUrl }
        : tweet
    ),
  }));
  
  return {
    ...outline,
    nodes: updatedNodes
  };
}

// 从 Outline 中移除图片
export function removeImageFromOutline(
  outline: Outline,
  tweetNumber: number
): Outline {
  return updateImageInOutline(outline, tweetNumber, null);
}

// 从思维导图构建新的 Outline 结构
export function buildOutlineFromMindmap(
  originalOutline: Outline,
  nodes: MindmapNodeData[]
): Outline {
  // 根据节点重新组织 outline 结构
  const topicNode = nodes.find((n) => n.type === 'topic');
  const outlineNodes = nodes.filter((n) => n.type === 'outline_point');
  const tweetNodes = nodes.filter((n) => n.type === 'tweet');
  
  const newOutline = { ...originalOutline };
  
  // 更新主题
  if (topicNode) {
    newOutline.topic = topicNode.label;
  }
  
  // 重新构建 nodes 数组
  newOutline.nodes = outlineNodes.map((outlineNode) => {
    const outlineIndex = outlineNode.data?.outlineIndex;
    const originalNode = originalOutline.nodes[outlineIndex!] || { tweets: [] };
    
    // 找到属于这个 outline 的所有 tweets
    const relatedTweets = tweetNodes
      .filter((t) => t.data?.groupIndex === outlineIndex)
      .map((tweetNode) => {
        const originalTweet = originalNode.tweets.find(
          (t) => t.tweet_number === tweetNode.data?.tweetId
        ) || {};
        
        return {
          ...(originalTweet as TweetContentItem),
          title: tweetNode.label,
          tweet_number: tweetNode.data?.tweetId || 0,
        };
      });
    
    return {
      ...originalNode,
      title: outlineNode.label,
      tweets: relatedTweets,
    };
  });
  
  return newOutline;
}

// 收集推文中的图片
export interface CollectedImage {
  src: string;
  alt: string;
  originalSectionId: string;
  tweetId?: string;
}

export function collectImagesFromTweets(outline: Outline): CollectedImage[] {
  const images: CollectedImage[] = [];
  
  outline.nodes.forEach((group) => {
    if (group.tweets && Array.isArray(group.tweets)) {
      group.tweets.forEach((tweet) => {
        if (tweet.image_url) {
          images.push({
            src: tweet.image_url,
            alt: tweet.content || tweet.title || 'Image',
            originalSectionId: `tweet-${tweet.tweet_number}`,
            tweetId: tweet.tweet_number.toString(),
          });
        }
      });
    }
  });
  
  return images;
}

// 生成完整内容用于复制
export function generateFullContent(outline: Outline): string {
  const sections: string[] = [];
  
  // 添加标题
  sections.push(`# ${outline.topic}\n`);
  
  // 添加每个组
  outline.nodes.forEach((group, groupIndex) => {
    if (group.title) {
      sections.push(`## ${groupIndex + 1}. ${group.title}`);
    }
    
    // 添加组内的推文
    group.tweets.forEach((tweet) => {
      if (tweet.title) {
        sections.push(`### ${tweet.title}`);
      }
      if (tweet.content) {
        sections.push(tweet.content);
      }
      sections.push(''); // 空行
    });
  });
  
  return sections.join('\n');
}

// 构建 Twitter 格式的推文数据
export function buildTwitterTweetData(outline: Outline) {
  return outline.nodes
    .flatMap((group) => group.tweets)
    .map((tweet, index) => {
      const totalTweets = outline.nodes.reduce(
        (total, g) => total + g.tweets.length,
        0,
      );
      const tweetNumber = index + 1;
      const content = tweet.content || tweet.title || '';
      const text = `${tweetNumber}/${totalTweets}\n\n${content}`;
      
      return {
        text,
        image_url: tweet.image_url,
      };
    });
}