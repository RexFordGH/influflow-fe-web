import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

async function userProfileExists(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // 查询用户个性化数据表检查用户是否已存在
    const { data, error } = await supabase
      .from('user_personalization')
      .select('uid')
      .eq('uid', userId)
      .single();

    // 如果查询出错且不是"未找到记录"错误，则认为用户不存在
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user profile:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user profile existence:', error);
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  console.log('URL params:', {
    code: code ? 'present' : 'missing',
    origin,
  });

  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    next = '/';
  }

  const redirectToError = (error: string) => {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error)}`,
    );
  };

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return redirectToError('Authentication failed.');
    }

    if (sessionData?.user) {
      const user = sessionData.user;

      // Check if the user is an existing user by looking for an existing profile.
      const isExistingUser = await userProfileExists(user.id);

      if (isExistingUser) {
        // This is an existing user, let them log in.
        console.log(`Existing user logged in: ${user.id}`);
      } else {
        // This is a new user - create their profile directly without requiring invitation code
        console.log(`New user detected: ${user.id}. Creating profile.`);

        try {
          const supabase = await createClient();

          // 创建用户个性化记录
          const { error: insertError } = await supabase
            .from('user_personalization')
            .insert({
              uid: user.id,
              account_name: null,
              tone: null,
              bio: null,
              tweet_examples: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            return redirectToError('Failed to create user profile.');
          }

          console.log(`Successfully created profile for new user: ${user.id}`);
        } catch (error) {
          console.error('Error in user creation process:', error);
          return redirectToError('Failed to complete user registration.');
        }
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://influxy.xyz';
      console.log('siteUrl + next', siteUrl, next);
      if (!siteUrl) {
        return redirectToError('Configuration error: Site URL is not defined.');
      }
      const redirectUrl = `${siteUrl}${next}`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  return redirectToError('Invalid authentication code.');
}
