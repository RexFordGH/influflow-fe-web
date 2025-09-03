import { NextResponse } from 'next/server';

import { API_HOST } from '@/constants/env';
import { createAdminClient, createClient } from '@/lib/supabase/server';

async function userProfileExists(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_personalization')
      .select('uid')
      .eq('uid', userId)
      .single();

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
    return redirect(`/?error=${encodeURIComponent('Invalid auth code')}`);
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
        console.error('Error creating user profile:', insertError);

        const adminClient = createAdminClient();
        await adminClient.auth.admin.deleteUser(user.id);

        return redirect(
          `/?error=${encodeURIComponent('Failed to create user profile')}`,
        );
      }

      if (referralCode) {
        try {
          const accessToken = sessionData.session?.access_token;

          const response = await fetch(`${API_HOST}/api/sign-up`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({
              referral_code: referralCode,
            }),
          });

          if (!response.ok) {
            console.error('Failed to bind referral:', await response.text());
          } else {
            console.log('Successfully bound referral for user:', user.id);
          }
        } catch (error) {
          console.error('Error binding referral:', error);
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
