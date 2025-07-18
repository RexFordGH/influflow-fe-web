import { ContentFormat } from './api';

export interface TweetContentItem {
  tweet_number: number;
  content: string;
  title: string;
  image_url?: string;
}

export interface Tweet {
  title: string;
  tweets: TweetContentItem[];
}

export interface Outline {
  id: string;
  content_format: ContentFormat;
  nodes: Tweet[];
  topic: string;
  total_tweets: number;
}
