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
  nodes: Tweet[];
  topic: string;
  total_tweets: number;
}
