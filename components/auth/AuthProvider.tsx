'use client';

import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

import { LoginModal } from './LoginModal';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    isLoginModalOpen,
    closeLoginModal,
    setSession,
    syncProfileFromSupabase,
    isAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const initializeAuth = async () => {
      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const user = {
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            'User',
          email: session.user.email || '',
          avatar:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture,
        };
        // 传递token信息到缓存
        setSession(
          user,
          session.access_token,
          session.expires_at ? session.expires_at * 1000 : undefined
        );
        await syncProfileFromSupabase();
      }

      // Set up auth state change listener for automatic token refresh and logout handling
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const user = session?.user
            ? {
                id: session.user.id,
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  'User',
                email: session.user.email || '',
                avatar:
                  session.user.user_metadata?.avatar_url ||
                  session.user.user_metadata?.picture,
              }
            : null;

          if (event === 'SIGNED_OUT') {
            setSession(null);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Token refreshed successfully');
            setSession(
              user,
              session.access_token,
              session.expires_at ? session.expires_at * 1000 : undefined
            );
          } else if (event === 'SIGNED_IN' && session) {
            setSession(
              user,
              session.access_token,
              session.expires_at ? session.expires_at * 1000 : undefined
            );
            // Fetch profile if not already authenticated
            if (!isAuthenticated) {
              try {
                await syncProfileFromSupabase();
              } catch (error) {
                console.error('Failed to fetch profile on sign in:', error);
              }
            }
          }
        },
      );

      // Return cleanup function
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    const cleanupPromise = initializeAuth();

    // Cleanup on unmount
    return () => {
      cleanupPromise.then((cleanup) => {
        if (cleanup) {
          cleanup();
        }
      });
    };
  }, [setSession, syncProfileFromSupabase, isAuthenticated]);

  return (
    <>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </>
  );
}
