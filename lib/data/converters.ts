import {
  type SimpleTweet as ContentTweet,
  type GeneratedContent,
  type MindmapEdgeData,
  type MindmapNodeData,
} from '@/types/content';
import { Outline } from '@/types/outline';

/**
 * 将API返回的Outline转换为思维导图数据结构
 */
export function convertThreadDataToMindmap(data: Outline): {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
} {
  const nodes: MindmapNodeData[] = [];
  const edges: MindmapEdgeData[] = [];

  // 1. 创建主题节点（Level 1）
  const topicNode: MindmapNodeData = {
    id: 'topic',
    label: data.topic,
    level: 1,
    type: 'topic',
    position: { x: 0, y: 0 }, // 初始位置设为0,0让dagre布局算法处理
  };
  nodes.push(topicNode);

  // 2. 创建分类节点（Level 2）- 基于 nodes (Tweet[])
  const outlineNodes = data.nodes || [];
  outlineNodes.forEach((tweetGroup: any, groupIndex: number) => {
    const groupNodeId = `group-${groupIndex}`;
    const groupNode: MindmapNodeData = {
      id: groupNodeId,
      label: tweetGroup.title,
      level: 2,
      type: 'outline_point',
      position: { x: 0, y: 0 }, // 初始位置设为0,0让dagre布局算法处理
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

    // 3. 创建Tweet内容节点（Level 3）- 只显示 title
    tweetGroup.tweets.forEach((tweetItem: any, tweetIndex: number) => {
      const tweetNodeId = `tweet-${groupIndex}-${tweetItem.tweet_number}`;
      const tweetNode: MindmapNodeData = {
        id: tweetNodeId,
        label: tweetItem.title, // 只显示 title
        level: 3,
        type: 'tweet',
        position: { x: 0, y: 0 }, // 初始位置设为0,0让dagre布局算法处理
        data: {
          tweetId: tweetItem.tweet_number,
          content: tweetItem.content,
          title: tweetItem.title,
          groupIndex, // 添加分组索引用于高亮联动
          tweetIndex, // 添加tweet索引用于高亮联动
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
  data: Outline,
): GeneratedContent {
  const mindmap = convertThreadDataToMindmap(data);

  // 将嵌套的tweets结构展平为简单数组
  const flatTweets: ContentTweet[] = [];
  (data?.nodes || []).forEach((tweetGroup: any) => {
    tweetGroup.tweets.forEach((tweetItem: any) => {
      flatTweets.push({
        id: tweetItem.tweet_number,
        content: tweetItem.content,
        order: tweetItem.tweet_number,
      });
    });
  });

  return {
    id: `generated-${Date.now()}`,
    topic: data.topic,
    createdAt: new Date().toISOString(),
    mindmap,
    tweets: flatTweets,
    outline: data,
    image: {
      url: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop&crop=center`,
      alt: `${data.topic}主题配图`,
      caption: `关于${data.topic}的深度分析和思考`,
      prompt: `Create a professional illustration about ${data.topic}`,
    },
    metadata: {
      totalTweets: data.total_tweets,
      estimatedReadTime: Math.ceil(
        flatTweets.reduce((acc, tweet) => acc + tweet.content.length, 0) / 200,
      ),
      sources: ['AI分析生成', '专业知识整合', '热点话题研究'],
    },
  };
}

/**
 * 将API数据直接转换为markdown格式（支持hover高亮）
 */
export function convertAPIDataToMarkdown(data: Outline): string {
  let markdown = '';

  // 移除标题和时间，放到最外层用普通的div来渲染， 2025.07.26
  // // 添加一级标题
  // markdown += `# ${data.topic}\n`;

  // // 添加当前时间 - 英文格式，紧跟标题
  // const currentTime = new Date().toLocaleString('en-US', {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  // });
  // markdown += `<div>Edited on ${currentTime}</div>\n\n`;

  // 按接口数据数组排列，包含分组标题
  data.nodes.forEach((tweetGroup: any, groupIndex: number) => {
    // 添加分组标题 (H2) 包含group标识符
    markdown += `<div data-group-id="${groupIndex}">\n\n`;
    markdown += `## ${tweetGroup.title}\n\n`;
    markdown += `</div>\n\n`;

    // 添加该分组下的tweets
    tweetGroup.tweets.forEach((tweetItem: any, tweetIndex: number) => {
      // 添加可用于高亮的标识符
      markdown += `<div data-tweet-id="${tweetItem.tweet_number}" data-group-index="${groupIndex}" data-tweet-index="${tweetIndex}">\n\n`;
      markdown += `### ${tweetItem.title}\n\n`;
      markdown += `${tweetItem.content}\n\n`;

      markdown += `</div>\n\n`;
    });
  });

  return markdown;
}

/**
 * 从思维导图数据直接生成markdown（用于Regenerate功能）- 支持多层级
 */
export function convertMindmapToMarkdown(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
): string {
  let markdown = '';

  // 1. 获取主题节点（level 1）
  const topicNode = nodes.find(
    (node) => node.type === 'topic' && node.level === 1,
  );
  if (!topicNode) {
    console.warn('未找到主题节点');
    return '';
  }

  // 添加主标题
  markdown += `# ${topicNode.label}\n`;

  // 添加当前时间 - 英文格式，紧跟标题
  const currentTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  markdown += `<div class="text-gray-500 text-sm mb-4">Edited on ${currentTime}</div>\n\n`;

  // 递归函数：处理任意层级的节点
  const renderNodeAndChildren = (
    nodeId: string,
    currentLevel: number,
  ): void => {
    // 获取当前节点的所有子节点
    const childIds = edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.target);

    if (childIds.length === 0) return;

    // 获取子节点并排序
    const childNodes = nodes
      .filter((node) => childIds.includes(node.id))
      .sort((a, b) => {
        // 优先按outlineIndex排序，其次按tweetId排序，最后按创建时间排序
        if (
          a.data?.outlineIndex !== undefined &&
          b.data?.outlineIndex !== undefined
        ) {
          return a.data.outlineIndex - b.data.outlineIndex;
        }
        if (a.data?.tweetId !== undefined && b.data?.tweetId !== undefined) {
          return a.data.tweetId - b.data.tweetId;
        }
        return a.id.localeCompare(b.id);
      });

    // 渲染每个子节点
    childNodes.forEach((childNode, index) => {
      const markdownLevel = Math.min(currentLevel + 1, 6); // markdown最多支持H6
      const headingPrefix = '#'.repeat(markdownLevel);

      // 生成合适的HTML标识符
      let divAttributes = '';
      if (
        childNode.type === 'outline_point' &&
        childNode.data?.outlineIndex !== undefined
      ) {
        divAttributes = `data-group-id="${childNode.data.outlineIndex}"`;
      } else if (
        childNode.type === 'tweet' &&
        childNode.data?.tweetId !== undefined
      ) {
        const groupIndex = childNode.data?.groupIndex ?? 0;
        const tweetIndex = childNode.data?.tweetIndex ?? index;
        divAttributes = `data-tweet-id="${childNode.data.tweetId}" data-group-index="${groupIndex}" data-tweet-index="${tweetIndex}"`;
      }

      // 添加标题
      const title = childNode.data?.title || childNode.label;
      const content = childNode.data?.content;

      // 将标题和内容都包裹在同一个div中，确保hover状态正确关联
      if (divAttributes) {
        markdown += `<div ${divAttributes}>\n\n`;
        markdown += `${headingPrefix} ${title}\n\n`;

        // 对于 tweet 节点，总是添加 content（即使与 title 相同）
        // 对于其他节点，只有当内容与标题不同时才添加
        if (content) {
          if (childNode.type === 'tweet') {
            // tweet 节点总是显示 content
            markdown += `${content}\n\n`;
          } else if (content !== title && content !== childNode.label) {
            // 其他节点只有内容不同时才显示
            markdown += `${content}\n\n`;
          }
        }

        markdown += `</div>\n\n`;
      } else {
        // 没有特殊属性时，直接添加标题和内容
        markdown += `${headingPrefix} ${title}\n\n`;
        if (content) {
          if (childNode.type === 'tweet') {
            // tweet 节点总是显示 content
            markdown += `${content}\n\n`;
          } else if (content !== title && content !== childNode.label) {
            // 其他节点只有内容不同时才显示
            markdown += `${content}\n\n`;
          }
        }
      }

      // 递归处理子节点
      renderNodeAndChildren(childNode.id, markdownLevel);
    });
  };

  // 从主题节点开始递归渲染
  renderNodeAndChildren(topicNode.id, 1);

  return markdown;
}
