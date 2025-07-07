import { createClient } from '@/lib/supabase/client';

// 用于调试 Supabase 认证和权限的工具函数
export const debugSupabaseAuth = async () => {
  const supabase = createClient();
  
  try {
    // 检查当前会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('=== Supabase Auth Debug ===');
    console.log('Session error:', sessionError);
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id);
    console.log('User email:', session?.user?.email);
    console.log('Access token exists:', !!session?.access_token);
    
    if (session?.user) {
      // 尝试查询用户数据
      const { data: profileData, error: queryError } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('uid', session.user.id);
        
      console.log('Query error:', queryError);
      console.log('Profile data:', profileData);
      
      // 检查 RLS 权限
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Auth user data:', authData);
      console.log('Auth error:', authError);
    }
    
    return { session, sessionError };
  } catch (error) {
    console.error('Debug auth error:', error);
    return { session: null, sessionError: error };
  }
};

// 测试 RLS 权限的函数
export const testRLSPermissions = async () => {
  const supabase = createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user');
      return;
    }
    
    const testData = {
      uid: session.user.id,
      account_name: 'Test Account',
      tone: 'Professional',
      bio: 'Test bio',
      tweet_examples: ['https://example.com'],
      updated_at: new Date().toISOString(),
    };
    
    // 测试插入
    console.log('Testing INSERT...');
    const { error: insertError } = await supabase
      .from('user_personalization')
      .insert(testData);
    
    console.log('Insert error:', insertError);
    
    // 测试查询
    console.log('Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('user_personalization')
      .select('*')
      .eq('uid', session.user.id);
    
    console.log('Select error:', selectError);
    console.log('Select data:', selectData);
    
    // 测试更新
    console.log('Testing UPDATE...');
    const { error: updateError } = await supabase
      .from('user_personalization')
      .update({ account_name: 'Updated Test Account' })
      .eq('uid', session.user.id);
    
    console.log('Update error:', updateError);
    
  } catch (error) {
    console.error('RLS test error:', error);
  }
};