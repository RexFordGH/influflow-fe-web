import { IContentFormat } from '@/types/api';
import { IOutline, ITweet, ITweetContentItem } from '@/types/outline';

interface BackendOutlineNode {
  title: string;
  leaf_nodes?: ITweetContentItem[];
  tweets?: ITweetContentItem[];
}

interface BackendOutline {
  id?: string;
  content_format?: IContentFormat;
  nodes?: BackendOutlineNode[];
  topic?: string;
  total_tweets?: number;
  updatedAt?: Date | number;
}

export function normalizeOutlineData(data: BackendOutline): IOutline {
  if (!data) {
    return {
      id: '',
      content_format: 'longform' as IContentFormat,
      nodes: [],
      topic: '',
      total_tweets: 0,
      mode: 'analysis',
      search_enabled: true,
    };
  }

  const normalizedNodes: ITweet[] = (data.nodes || []).map((node) => {
    const tweets = node.tweets || node.leaf_nodes || [];

    return {
      title: node.title || '',
      tweets: tweets.map((tweet) => ({
        // @ts-ignore
        tweet_number: tweet.tweet_number || tweet.content_number || 0,
        content: tweet.content || '',
        title: tweet.title || '',
        image_url: tweet.image_url || null,
      })),
    };
  });

  return {
    id: data.id || '',
    content_format: data.content_format || ('longform' as IContentFormat),
    nodes: normalizedNodes,
    topic: data.topic || '',
    total_tweets: data.total_tweets || 0,
    updatedAt: data.updatedAt,
    mode: 'analysis',
    search_enabled: true,
  };
}

export function processChatOutline(chatData: any): IOutline | null {
  if (!chatData?.data?.outline) {
    return null;
  }

  return normalizeOutlineData(chatData.data.outline);
}
