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
}
