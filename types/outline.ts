import { IContentFormat } from './api';
import { IDraftData } from './draft';

export interface ITweetContentItem {
  tweet_number: number;
  content: string;
  title: string;
  image_url?: string | null;
}

export interface ITweet {
  title: string;
  tweets: ITweetContentItem[];
}

export interface IOutline {
  id: string;
  content_format: IContentFormat;
  nodes: ITweet[];
  topic: string;
  total_tweets: number;
  updatedAt?: Date | number;
  // 新增用户输入和draft数据
  // 用于传递到prompt history
  userInput?: string;
  draft?: IDraftData | null;
}
