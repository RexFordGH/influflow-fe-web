'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { IContentFormat, IMode } from '@/types/api';
import type { IDraftData } from '@/types/draft';
import { ITweet } from '@/types/outline';

export interface IArticleOfDB {
  id: string;
  uid: string;
  topic: string;
  tweets: ITweet[];
  created_at: string; // ISO string from Supabase
  updated_at: string; // ISO string from Supabase
  content_format: IContentFormat;
  user_input: string | null;
  draft: IDraftData | null;
  mode: IMode;
  search_enabled: boolean;
}

export const useTweetThreadData = () => {
  const [isLoadingTweetThread, setIsLoadingTweetThread] = useState(false);

  // 从 Supabase 通过 id 查询 tweet_thread 表的完整记录
  const fetchTweetThreadFromSupabase = useCallback(
    async (id: string): Promise<IArticleOfDB | null> => {
      if (!id) {
        console.warn('Missing id for fetching tweet thread data');
        return null;
      }

      try {
        setIsLoadingTweetThread(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from('tweet_thread')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching tweet thread from Supabase:', error);
          return null;
        }
        return data as IArticleOfDB;
      } catch (error) {
        console.error('Failed to fetch tweet thread data:', error);
        return null;
      } finally {
        setIsLoadingTweetThread(false);
      }
    },
    [],
  );

  return {
    fetchTweetThreadFromSupabase,
    isLoadingTweetThread,
  };
};
