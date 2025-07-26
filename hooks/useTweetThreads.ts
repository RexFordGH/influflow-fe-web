'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { Tweet } from '@/types/outline';

export interface TweetThread {
  id: string;
  uid: string;
  topic: string;
  tweets: Tweet[];
  created_at: string;
  updated_at: string;
}

export const useTweetThreads = (uid?: string) => {
  const [tweetThreads, setTweetThreads] = useState<TweetThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // 只有在有有效的 uid 时才拉取数据
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      setTweetThreads([]);
      setLoading(false);
      return;
    }

    const fetchTweetThreads = async () => {
      try {
        setLoading(true);
        setError(null);

        // 本地开发环境只取前 10 条数据
        const query = supabase
          .from('tweet_thread')
          .select('*')
          .eq('uid', uid) // 确保只拉取当前用户的数据
          .order('created_at', { ascending: false });

        // 在开发环境限制数据量
        if (process.env.NEXT_PUBLIC_ENV === 'local') {
          query.limit(10);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // 额外的安全检查：确保返回的数据都属于当前用户
        const filteredData = (data || []).filter(
          (thread) => thread.uid === uid,
        );
        setTweetThreads(filteredData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch tweet threads',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTweetThreads();
  }, [uid, supabase]);

  return {
    tweetThreads,
    loading,
    error,
    refetch: () => {
      // 只有在有有效的 uid 时才重新拉取数据
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        setTweetThreads([]);
        setLoading(false);
        return;
      }

      const fetchTweetThreads = async () => {
        try {
          setLoading(true);
          setError(null);

          // 本地开发环境只取前 10 条数据
          const query = supabase
            .from('tweet_thread')
            .select('*')
            .eq('uid', uid) // 确保只拉取当前用户的数据
            .order('created_at', { ascending: false });

          // 在开发环境限制数据量
          if (process.env.NEXT_PUBLIC_ENV === 'local') {
            query.limit(10);
          }

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          // 额外的安全检查：确保返回的数据都属于当前用户
          const filteredData = (data || []).filter(
            (thread) => thread.uid === uid,
          );
          setTweetThreads(filteredData);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch tweet threads',
          );
        } finally {
          setLoading(false);
        }
      };

      fetchTweetThreads();
    },
  };
};
