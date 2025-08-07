'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { IDraftData } from '@/types/draft';

interface DraftDataResponse {
  draft: IDraftData | null;
  user_input: string | null;
}

export const useDraftData = () => {
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // 从Supabase获取draft数据的函数
  const fetchDraftFromSupabase = useCallback(
    async (
      outlineId: string,
      userId: string,
    ): Promise<DraftDataResponse | null> => {
      if (!outlineId || !userId) {
        console.warn('Missing outlineId or userId for fetching draft data');
        return null;
      }

      try {
        setIsLoadingDraft(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from('tweet_thread')
          .select('draft, user_input')
          .eq('id', outlineId)
          .eq('uid', userId)
          .single();

        if (error) {
          console.error('Error fetching draft data from Supabase:', error);
          return null;
        }

        console.log('Fetched draft data from Supabase:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch draft data:', error);
        return null;
      } finally {
        setIsLoadingDraft(false);
      }
    },
    [],
  );

  return {
    fetchDraftFromSupabase,
    isLoadingDraft,
  };
};
