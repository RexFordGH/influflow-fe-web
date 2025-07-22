export interface TweetData {
  id: string;
  content: string;
  imageUrl?: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  createdAt: string;
  isSelected?: boolean;
}

export interface TrendingTopicTweets {
  topicId: string;
  topicTitle: string;
  tweets: TweetData[];
}
