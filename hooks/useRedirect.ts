import { useCallback } from 'react';

export function useRedirect() {
  const getOrigin = useCallback(() => {
    return typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.influxy.xyz';
  }, []);

  const getAuthCallbackUrl = useCallback(
    (type: 'default' | 'referral' = 'default', params?: { referralCode?: string; next?: string }) => {
      const origin = getOrigin();
      const nextParam =
        typeof params?.next === 'string'
          ? `?next=${encodeURIComponent(params.next)}`
          : '';

      if (type === 'referral' && params?.referralCode) {
        return `${origin}/api/auth/referral/callback/${encodeURIComponent(params.referralCode)}${nextParam}`;
      }

      return `${origin}/api/auth/callback${nextParam}`;
    },
    [getOrigin]
  );

  return {
    origin: getOrigin(),
    getOrigin,
    getAuthCallbackUrl,
  };
}