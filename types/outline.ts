export interface TweetContentItem {
  tweet_number: number;
  content: string;
  title: string;
}

export interface Tweet {
  title: string;
  tweets: TweetContentItem[];
}

export interface Outline {
  nodes: Tweet[];
  topic: string;
  total_tweets: number;
}
