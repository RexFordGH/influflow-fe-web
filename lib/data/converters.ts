import { 
  type GenerateThreadResponse,
  type Tweet as ApiTweet,
  type Outline as ApiOutline
} from '@/types/api';
import { 
  type MindmapNodeData, 
  type MindmapEdgeData, 
  type GeneratedContent,
  type Tweet as ContentTweet,
  type Outline as ContentOutline
} from '@/types/content';

/**
 * 将API返回的GenerateThreadResponse转换为思维导图数据结构
 */
export function convertThreadDataToMindmap(
  data: GenerateThreadResponse
): { nodes: MindmapNodeData[]; edges: MindmapEdgeData[] } {
  const nodes: MindmapNodeData[] = [];
  const edges: MindmapEdgeData[] = [];

  // 1. 创建主题节点（Level 1）
  const topicNode: MindmapNodeData = {
    id: 'topic',
    label: data.outline.topic,
    level: 1,
    type: 'topic',
    position: { x: 50, y: 200 },
  };
  nodes.push(topicNode);

  // 2. 创建分类节点（Level 2）- 基于 outline.nodes (Tweet[])
  const outlineNodes = data.outline.nodes || [];
  outlineNodes.forEach((tweetGroup, groupIndex) => {
    const groupNodeId = `group-${groupIndex}`;
    const groupNode: MindmapNodeData = {
      id: groupNodeId,
      label: tweetGroup.title,
      level: 2,
      type: 'outline_point',
      position: { x: 300, y: 80 + groupIndex * 120 },
      data: {
        outlineIndex: groupIndex,
      },
    };
    nodes.push(groupNode);

    // 创建从主题到分类的连接
    edges.push({
      id: `edge-topic-${groupNodeId}`,
      source: 'topic',
      target: groupNodeId,
      type: 'smoothstep',
    });

    // 3. 创建Tweet内容节点（Level 3）
    tweetGroup.tweets.forEach((tweetItem, tweetIndex) => {
      const tweetNodeId = `tweet-${groupIndex}-${tweetItem.tweet_number}`;
      const tweetNode: MindmapNodeData = {
        id: tweetNodeId,
        label: tweetItem.content,
        level: 3,
        type: 'tweet',
        position: { 
          x: 550, 
          y: 60 + groupIndex * 120 + tweetIndex * 40 
        },
        data: {
          tweetId: tweetItem.tweet_number,
          content: tweetItem.content,
          title: tweetItem.title,
        },
      };
      nodes.push(tweetNode);

      // 创建从分类到tweet的连接
      edges.push({
        id: `edge-${groupNodeId}-${tweetNodeId}`,
        source: groupNodeId,
        target: tweetNodeId,
        type: 'smoothstep',
      });
    });
  });

  return { nodes, edges };
}

/**
 * 将API数据转换为完整的GeneratedContent
 */
export function convertAPIDataToGeneratedContent(
  data: GenerateThreadResponse
): GeneratedContent {
  const mindmap = convertThreadDataToMindmap(data);
  
  // 将嵌套的tweets结构展平为简单数组
  const flatTweets: ContentTweet[] = [];
  data.outline.nodes.forEach((tweetGroup) => {
    tweetGroup.tweets.forEach((tweetItem) => {
      flatTweets.push({
        id: tweetItem.tweet_number,
        content: tweetItem.content,
        order: tweetItem.tweet_number,
      });
    });
  });
  
  return {
    id: `generated-${Date.now()}`,
    topic: data.outline.topic,
    createdAt: new Date().toISOString(),
    mindmap,
    tweets: flatTweets,
    outline: {
      points: data.outline.nodes.map(node => node.title),
      structure: data.outline.nodes.map(node => node.title).join(' → '),
    } as ContentOutline,
    image: {
      url: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop&crop=center`,
      alt: `${data.outline.topic}主题配图`,
      caption: `关于${data.outline.topic}的深度分析和思考`,
      prompt: `Create a professional illustration about ${data.outline.topic}`,
    },
    metadata: {
      totalTweets: data.outline.total_tweets,
      estimatedReadTime: Math.ceil(flatTweets.reduce((acc, tweet) => acc + tweet.content.length, 0) / 200),
      sources: [
        'AI分析生成',
        '专业知识整合',
        '热点话题研究',
      ],
    },
  };
}

/**
 * 将tweets转换为markdown格式
 */
export function convertTweetsToMarkdown(
  tweets: ContentTweet[],
  topic: string,
  outline: ContentOutline
): string {
  // 按order排序
  const sortedTweets = [...tweets].sort((a, b) => a.order - b.order);
  
  let markdown = `# ${topic} Twitter线程 🧵\n\n`;
  
  // 添加大纲信息
  if (outline?.points && outline.points.length > 0) {
    markdown += `## 内容大纲 📋\n\n`;
    outline.points.forEach((point: string, index: number) => {
      markdown += `${index + 1}. ${point}\n`;
    });
    markdown += `\n`;
  }
  
  // 添加推文内容
  markdown += `## 完整线程内容 💬\n\n`;
  sortedTweets.forEach((tweet, index) => {
    markdown += `**${index + 1}/${tweets.length}**\n\n`;
    markdown += `${tweet.content}\n\n`;
    markdown += `---\n\n`;
  });
  
  // 添加总结
  markdown += `## 总结 📝\n\n`;
  markdown += `本线程共 ${tweets.length} 条推文，围绕"${topic}"主题展开深入探讨。`;
  markdown += `通过结构化的内容组织，为读者提供了全面而有价值的信息。\n\n`;
  markdown += `#${topic.replace(/\s+/g, '')} #TwitterThread #内容创作`;
  
  return markdown;
}

/**
 * 从思维导图数据重新生成tweets（用于编辑后同步）
 */
export function convertMindmapToTweets(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[]
): { tweets: ContentTweet[]; outline: ContentOutline } {
  // 获取大纲点节点
  const outlineNodes = nodes
    .filter(node => node.type === 'outline_point')
    .sort((a, b) => (a.data?.outlineIndex || 0) - (b.data?.outlineIndex || 0));
  
  // 获取tweet节点
  const tweetNodes = nodes
    .filter(node => node.type === 'tweet')
    .sort((a, b) => (a.data?.tweetId || 0) - (b.data?.tweetId || 0));
  
  // 重构tweets
  const tweets: ContentTweet[] = tweetNodes.map((node, index) => ({
    id: node.data?.tweetId || index + 1,
    content: node.label,
    order: index + 1,
  }));
  
  // 重构outline
  const outline: ContentOutline = {
    points: outlineNodes.map(node => node.label),
    structure: outlineNodes.map(node => node.label).join(' → '),
  };
  
  return { tweets, outline };
}