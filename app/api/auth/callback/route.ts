import { NextResponse } from 'next/server';

import { API_HOST } from '@/constants/env';
import { createClient } from '@/lib/supabase/server';

async function userProfileExists(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // 使用 maybeSingle()：未找到时返回 data=null、error=null；其他错误抛出
  const { data, error } = await supabase
    .from('user_personalization')
    .select('uid')
    .eq('uid', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking user profile:', error);
    throw error;
  }

  return !!data;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    next = '/';
  }

  const redirectToError = (error: string) => {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  };

  try {
    console.log('URL params:', {
      code: code ? 'present' : 'missing',
      origin,
    });

    if (!code) {
      return redirectToError('Invalid authentication code.');
    }

    const supabase = await createClient();
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return redirectToError('Authentication failed.');
    }

    if (!sessionData?.user) {
      return redirectToError('Authentication failed.');
    }

    const user = sessionData.user;

    // Check if the user is an existing user by looking for an existing profile.
    const isExistingUser = await userProfileExists(user.id);

    if (isExistingUser) {
      console.log(`Existing user logged in: ${user.id}`);
    } else {
      // This is a new user - create their profile directly without requiring invitation code
      console.log(`New user detected: ${user.id}. Creating profile.`);

      // 创建用户个性化记录，处理唯一键冲突
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
        const errCode = (insertError as any).code;
        if (errCode === '23505') {
          console.warn('Profile already exists (unique violation). Proceeding.');
        } else {
          console.error('Error creating user profile:', insertError);
          return redirectToError('Failed to create user profile.');
        }
      }

      // Call sign-up API with empty referral code for new users (blocking)
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        console.error('Missing access token for sign-up call.');
        return redirectToError('Failed to complete user registration.');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`${API_HOST}/api/sign-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            referral_code: '',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.error('Failed to complete sign-up:', response.status);
          return redirectToError('Failed to complete user registration.');
        }
        console.log('Successfully completed sign-up for user:', user.id);
      } catch (error) {
        clearTimeout(timeout);
        console.error('Error calling sign-up API:', error);
        return redirectToError('Failed to complete user registration.');
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
    const redirectUrl = `${siteUrl}${next}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Unhandled error in auth callback:', error);
    return redirectToError('Unexpected error during authentication.');
  }
}
