import { addToast } from '@/components/base/toast';
import { createClient } from '@/lib/supabase/client';
import { IOutline } from '@/types/outline';

/**
 * 保存 tweets 数据到 Supabase
 * @param outline - 完整的 outline 数据
 * @param onSuccess - 成功回调
 * @param onError - 失败回调
 * @returns Promise<boolean> - 是否保存成功
 */
export async function saveTweetsToSupabase(
  outline: IOutline,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  if (!outline?.id || !outline?.nodes) {
    console.error('Invalid outline data for saving to Supabase');
    return false;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('tweet_thread')
      .update({ 
        tweets: outline.nodes,
        updated_at: new Date().toISOString()
      })
      .eq('id', outline.id);

    if (error) {
      throw error;
    }

    console.log('Content saved successfully to Supabase.');
    
    addToast({
      title: 'Success',
      description: 'Content saved successfully',
      color: 'success'
    });

    onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error saving content to Supabase:', error);
    
    addToast({
      title: 'Warning',
      description: 'Content updated locally but failed to save to server',
      color: 'warning'
    });

    onError?.(error as Error);
    return false;
  }
}

/**
 * 保存 outline 数据到 Supabase (包含所有字段)
 * @param outline - 完整的 outline 数据  
 * @param onSuccess - 成功回调
 * @param onError - 失败回调
 * @returns Promise<boolean> - 是否保存成功
 */
export async function saveOutlineToSupabase(
  outline: IOutline,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  if (!outline?.id) {
    console.error('Invalid outline data: missing id');
    return false;
  }

  try {
    const supabase = createClient();
    
    // 准备更新数据，只更新数据库中存在的字段
    const updateData: any = {
      tweets: outline.nodes,
      topic: outline.topic,
      content_format: outline.content_format,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('tweet_thread')
      .update(updateData)
      .eq('id', outline.id);

    if (error) {
      throw error;
    }

    console.log('Outline saved successfully to Supabase.');
    
    addToast({
      title: 'Success',
      description: 'Content saved successfully',
      color: 'success'
    });

    onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error saving outline to Supabase:', error);
    
    addToast({
      title: 'Warning', 
      description: 'Content updated locally but failed to save to server',
      color: 'warning'
    });

    onError?.(error as Error);
    return false;
  }
}