import { NextResponse } from 'next/server';

import { API_HOST } from '@/constants/env';
import { createAdminClient, createClient } from '@/lib/supabase/server';

async function userProfileExists(userId: string): Promise<boolean> {
  const supabase = await createClient();

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ referral_code: string }> },
) {
  const { searchParams, origin } = new URL(request.url);
  const resolvedParams = await params;
  const referralCode = decodeURIComponent(resolvedParams.referral_code || '');
  const code = searchParams.get('code');

  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    next = '/';
  }

  const redirect = (path: string) => NextResponse.redirect(`${origin}${path}`);

  if (!code) {
    // 检查 Supabase 返回的错误信息
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    
    let errorMessage = 'Invalid auth code';
    
    if (error || errorCode || errorDescription) {
      // 构建更详细的错误信息
      errorMessage = errorDescription || error || errorCode || errorMessage;
    }
    
    return redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  }

  try {
    const supabase = await createClient();

    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !sessionData?.user) {
      console.error('Error exchanging code for session:', exchangeError);
      return redirect(`/?error=${encodeURIComponent('Authentication failed')}`);
    }

    const user = sessionData.user;
    const isExistingUser = await userProfileExists(user.id);

    if (isExistingUser) {
      console.log(`Existing user logged in: ${user.id}`);
    } else {
      console.log(
        `New user detected: ${user.id}. Creating profile and binding referral.`,
      );

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
          try {
            const adminClient = createAdminClient();
            await adminClient.auth.admin.deleteUser(user.id);
          } catch (delErr) {
            console.error('Failed to rollback user after profile creation error:', delErr);
          }
          return redirect(
            `/?error=${encodeURIComponent('Failed to create user profile')}`,
          );
        }
      }

      if (referralCode) {
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          console.error('Missing access token for sign-up call.');
          return redirect(`/?error=${encodeURIComponent('Failed to complete user registration')}`);
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
              referral_code: referralCode,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!response.ok) {
            console.error('Failed to bind referral:', response.status);
            return redirect(`/?error=${encodeURIComponent('Failed to complete user registration')}`);
          }
          console.log('Successfully bound referral for user:', user.id);
        } catch (error) {
          clearTimeout(timeout);
          console.error('Error binding referral:', error);
          return redirect(`/?error=${encodeURIComponent('Failed to complete user registration')}`);
        }
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
    return NextResponse.redirect(`${siteUrl}${next}`);
  } catch (error) {
    console.error('Unexpected error in referral callback:', error);
    return redirect(
      `/?error=${encodeURIComponent('An unexpected error occurred')}`,
    );
  }
}
