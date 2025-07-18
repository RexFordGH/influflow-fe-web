import { NextResponse } from 'next/server';

import { API_HOST } from '@/constants/env';
import { createAdminClient, createClient } from '@/lib/supabase/server';

async function consumeInvitationCode(code: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_HOST}/api/consume-invitation-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();

    console.log('validateInvitationCode', code, result);
    return result.data.success === true;
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return false;
  }
}

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invitation_code: string }> },
) {

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const resolvedParams = await params;
  const invitationCode = decodeURIComponent(resolvedParams.invitation_code);

  // console.log('URL params:', {
  //   code: code ? 'present' : 'missing',
  //   invitationCode: invitationCode || 'missing',
  //   origin,
  // });

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

      // Check if the user is a new user by looking for an existing profile.
      const isExistingUser = await userProfileExists(user.id);

      if (isExistingUser) {
        // This is an existing user, let them log in.
        console.log(`Existing user logged in: ${user.id}`);
      } else {
        // This is a new user, an invitation code is required.
        console.log(
          `New user detected: ${user.id}. Checking for invitation code.`,
        );
        if (!invitationCode) {
          console.error(
            'New user tried to sign up without an invitation code. Deleting orphan user.',
          );
          // IMPORTANT: Clean up the newly created Supabase user to prevent orphans.
          const adminClient = createAdminClient();
          await adminClient.auth.admin.deleteUser(user.id);
          return redirectToError(
            'An invitation code is required for new users.',
          );
        }

        const isCodeValid = await consumeInvitationCode(invitationCode);
        if (!isCodeValid) {
          console.error(
            `Invalid invitation code used: ${invitationCode}. Deleting orphan user.`,
          );
          // IMPORTANT: Clean up the newly created Supabase user.
          const adminClient = createAdminClient();
          await adminClient.auth.admin.deleteUser(user.id);
          return redirectToError('The provided invitation code is invalid.');
        }

        // Code is valid, proceed with creating the user profile and marking code as used
        console.log(
          `Invitation code ${invitationCode} is valid. Creating profile for new user ${user.id}.`,
        );

        try {
          // 在数据库事务中完成用户创建和邀请码标记
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
