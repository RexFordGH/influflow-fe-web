import { createClient } from '@/lib/supabase/client';
import { ProfileData } from './profileStorage';

export interface UserPersonalization {
  uid: string;
  account_name: string | null;
  tone: string | null;
  bio: string | null;
  tweet_examples: string[] | null;
  user_style_summary: string | null;
  tweet_example_urls: string[] | null;
  user_tweets: string[] | null;
  created_at: string;
  updated_at: string;
}

export const saveProfileToSupabase = async (
  profileData: ProfileData,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    // 获取当前用户
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth error:', authError);
      return {
        success: false,
        error: `Authentication error: ${authError.message}`,
      };
    }

    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userId = session.user.id;
    console.log('User ID:', userId);

    // 准备数据 - 只包含传入的字段，避免覆盖未传入的字段
    const upsertData: any = {
      uid: userId,
      updated_at: new Date().toISOString(),
    };

    // 只添加 profileData 中实际存在的字段
    if ('account_name' in profileData) {
      upsertData.account_name = profileData.account_name || null;
    }
    if ('tone' in profileData) {
      upsertData.tone = profileData.tone || null;
    }
    if ('bio' in profileData) {
      upsertData.bio = profileData.bio || null;
    }
    if ('tweet_examples' in profileData) {
      upsertData.tweet_examples = profileData.tweet_examples || null;
    }
    if ('user_style_summary' in profileData) {
      upsertData.user_style_summary = profileData.user_style_summary || null;
    }
    if ('tweet_example_urls' in profileData) {
      upsertData.tweet_example_urls = profileData.tweet_example_urls || null;
    }

    console.log('Upsert data:', upsertData);

    // 先尝试查询现有记录
    const { data: existingData, error: queryError } = await supabase
      .from('user_personalization')
      .select('*')
      .eq('uid', userId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Query error:', queryError);
      return { success: false, error: `Query error: ${queryError.message}` };
    }

    let result;
    if (existingData) {
      // 更新现有记录
      result = await supabase
        .from('user_personalization')
        .update(upsertData)
        .eq('uid', userId);
    } else {
      // 插入新记录
      result = await supabase.from('user_personalization').insert(upsertData);
    }

    if (result.error) {
      console.error('Supabase operation error:', result.error);
      return {
        success: false,
        error: `Database error: ${result.error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save profile to Supabase:', error);
    return { success: false, error: 'Failed to save profile data' };
  }
};

export const loadProfileFromSupabase = async (): Promise<{
  data: ProfileData | null;
  error?: string;
}> => {
  try {
    const supabase = createClient();

    // 获取当前用户
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return { data: null, error: 'User not authenticated' };
    }

    const userId = session.user.id;

    // 查询用户个性化数据
    const { data, error } = await supabase
      .from('user_personalization')
      .select('*')
      .eq('uid', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 表示未找到记录
      console.error('Supabase query error:', error);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null };
    }

    // 转换数据格式
    const profileData: ProfileData = {
      account_name: data.account_name || undefined,
      tone: (data.tone as ProfileData['tone']) || undefined,
      bio: data.bio || undefined,
      tweet_examples: data.tweet_examples || undefined,
      user_style_summary: data.user_style_summary || undefined,
      tweet_example_urls: data.tweet_example_urls || undefined,
      user_tweets: data.user_tweets || undefined,
    };

    return { data: profileData };
  } catch (error) {
    console.error('Failed to load profile from Supabase:', error);
    return { data: null, error: 'Failed to load profile data' };
  }
};
