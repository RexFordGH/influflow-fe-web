'use client';

import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

import { LoginModal } from './LoginModal';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoginModalOpen, closeLoginModal, setSession } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

        setSession(user, session?.access_token ?? null);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setSession]);

  return (
    <>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </>
  );
}
