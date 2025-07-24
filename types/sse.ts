export type StageKey = 'extract_url' | 'analysis_user_input' | 'web_search' | 'generate_tweet';

export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface StageInfo {
  id: StageKey;
  name: StageKey;
  displayName: string;
  status: StageStatus;
}

export const STAGES_INITIAL: Record<StageKey, StageInfo> = {
  extract_url: {
    id: 'extract_url',
    name: 'extract_url',
    displayName: '提取URL内容',
    status: 'pending',
  },
  analysis_user_input: {
    id: 'analysis_user_input',
    name: 'analysis_user_input',
    displayName: '分析用户输入',
    status: 'pending',
  },
  web_search: {
    id: 'web_search',
    name: 'web_search',
    displayName: '搜索相关内容',
    status: 'pending',
  },
  generate_tweet: {
    id: 'generate_tweet',
    name: 'generate_tweet',
    displayName: '生成内容',
    status: 'pending',
  },
};

export type StreamItem =
  | { type: 'topic'; topic: string }
  | { type: 'section'; section_title: string; content?: string }
  | { type: 'tweet'; tweet_number: number; tweet_title?: string; section_title?: string; tweet_content: string };
