'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export interface AsyncJobRow {
  job_id: string;
  user_id: string | null;
  status: string | null;
  tweet_id: string | null;
  updated_at: string; // ISO string from Supabase
  created_at: string; // ISO string from Supabase
}

// 通过 job_id 查询异步任务的完整记录
export const useAsyncJob = () => {
  const [isLoadingAsyncJob, setIsLoadingAsyncJob] = useState(false);

  const fetchAsyncJobById = useCallback(
    async (jobId: string): Promise<AsyncJobRow | null> => {
      if (!jobId) {
        console.warn('Missing job_id for fetching async job');
        return null;
      }

      try {
        setIsLoadingAsyncJob(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('async_job')
          .select('*')
          .eq('job_id', jobId)
          .single();

        if (error) {
          console.error('Error fetching async job from Supabase:', error);
          return null;
        }

        return data as AsyncJobRow;
      } catch (error) {
        console.error('Failed to fetch async job:', error);
        return null;
      } finally {
        setIsLoadingAsyncJob(false);
      }
    },
    [],
  );

  return {
    fetchAsyncJobById,
    isLoadingAsyncJob,
  };
};


