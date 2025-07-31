import { ContentFormat } from '@/types/api';
import { Outline, Tweet } from '@/types/outline';

/**
 * 验证数据是否为有效的 Outline 格式
 */
export function validateOutlineData(data: unknown): data is Outline {
  if (!data || typeof data !== 'object') return false;

  const outline = data as any;

  // 检查必需的顶级字段
  if (
    typeof outline.id !== 'string' ||
    !Array.isArray(outline.nodes) ||
    typeof outline.topic !== 'string' ||
    typeof outline.total_tweets !== 'number'
  ) {
    return false;
  }

  // 检查 nodes 数组中的每个元素
  for (const node of outline.nodes) {
    if (!isValidTweetNode(node)) {
      return false;
    }
  }

  return true;
}

/**
 * 验证 Tweet 节点的有效性
 */
function isValidTweetNode(node: unknown): node is Tweet {
  if (!node || typeof node !== 'object') return false;

  const tweet = node as any;

  // 检查 title
  if (typeof tweet.title !== 'string') return false;

  // 检查 tweets 数组
  if (!Array.isArray(tweet.tweets)) return false;

  // 检查每个 tweet 内容项
  for (const item of tweet.tweets) {
    if (
      typeof item.tweet_number !== 'number' ||
      typeof item.content !== 'string' ||
      typeof item.title !== 'string'
    ) {
      return false;
    }

    // image_url 是可选的，但如果存在必须是 string 或 null
    if (
      item.image_url !== undefined &&
      item.image_url !== null &&
      typeof item.image_url !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * MarkdownSection 接口定义
 */
export interface MarkdownSection {
  id: string;
  type: 'list' | 'tweet' | 'group' | 'heading' | 'paragraph' | 'tweetTitle';
  level?: number;
  content: string;
  rawContent: string;
  mappingId?: string;
  tweetId?: string;
  groupIndex?: number;
  tweetIndex?: number;
  groupId?: string;
  title?: string;
  imageUrl?: string | null;
  // 新增字段用于 tweetTitle 类型
  titleIndex?: number; // 标题在整体中的序号
  isFirstTitle?: boolean; // 是否为第一个标题（不显示序号）
}

/**
 * 将 Outline 数据转换为 MarkdownSection 数组
 */
export function processSectionsFromOutline(
  outline: Outline,
  options?: {
    contentFormat?: ContentFormat;
  },
): MarkdownSection[] {
  // 确定内容格式
  const contentFormat =
    options?.contentFormat || outline.content_format || 'thread';

  // 根据内容格式选择处理逻辑
  if (contentFormat === 'longform') {
    return processLongformSections(outline);
  } else {
    return processStandardSections(outline);
  }
}

/**
 * 处理标准格式（thread）的 sections
 */
function processStandardSections(outline: Outline): MarkdownSection[] {
  const sections: MarkdownSection[] = [];

  outline.nodes.forEach((group, groupIndex) => {
    // 创建 group section
    sections.push({
      id: `group-section-${groupIndex}`,
      type: 'group',
      content: group.title,
      rawContent: group.title,
      groupId: groupIndex.toString(),
      groupIndex,
      level: 2,
    });

    // 创建 tweet sections
    group.tweets.forEach((tweet, tweetIndex) => {
      sections.push({
        id: `tweet-section-${tweet.tweet_number}`,
        type: 'tweet',
        content: tweet.content,
        rawContent: tweet.content,
        tweetId: tweet.tweet_number.toString(),
        groupIndex,
        tweetIndex,
        level: 3,
        title: tweet.title,
        imageUrl: tweet.image_url,
      });
    });
  });

  return sections;
}

/**
 * 处理长文格式（longform）的 sections
 */
function processLongformSections(outline: Outline): MarkdownSection[] {
  const sections: MarkdownSection[] = [];

  outline.nodes.forEach((group, groupIndex) => {
    // 创建一级标题 (group section)
    sections.push({
      id: `group-section-${groupIndex}`,
      type: 'group',
      content: group.title,
      rawContent: group.title,
      groupId: groupIndex.toString(),
      groupIndex,
      level: 2,
      isFirstTitle: groupIndex === 0, // 第一个group标题标记为isFirstTitle
    });

    // 创建 tweet sections，不再创建二级标题
    group.tweets.forEach((tweet, tweetIndex) => {
      sections.push({
        id: `tweet-section-${tweet.tweet_number}`,
        type: 'tweet',
        content: tweet.content,
        rawContent: tweet.content,
        tweetId: tweet.tweet_number.toString(),
        groupIndex,
        tweetIndex,
        level: 3,
        title: tweet.title,
        imageUrl: tweet.image_url,
      });
    });
  });

  return sections;
}

/**
 * 保持原始换行符
 */
export function preserveLineBreaks(content: string): string {
  // 保持原始换行符，不进行额外处理
  return content;
}

/**
 * 格式化内容用于显示
 */
export function formatContentForDisplay(
  content: string,
  type: 'tweet' | 'group' | 'tweetTitle',
): string {
  // 目前只是保持原样，后续可以根据需要添加格式化逻辑
  return preserveLineBreaks(content);
}

export function getEmojiNumber(index: number) {
  const emojiNumbers = [
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣',
    '5️⃣',
    '6️⃣',
    '7️⃣',
    '8️⃣',
    '9️⃣',
    '🔟',
    '1️⃣1️⃣',
    '1️⃣2️⃣',
    '1️⃣3️⃣',
    '1️⃣4️⃣',
    '1️⃣5️⃣',
    '1️⃣6️⃣',
    '1️⃣7️⃣',
    '1️⃣8️⃣',
    '1️⃣9️⃣',
    '2️⃣0️⃣',
  ];
  return emojiNumbers[index] || `${index + 1}️⃣`;
}
