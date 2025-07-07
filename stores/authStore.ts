import { createClient } from '@/lib/supabase/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  account_name?: string;
  tone?: 'Professional' | 'Humorous' | 'Inspirational' | 'Customize';
  tweet_examples?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;

  // Actions
  setSession: (user: User | null, accessToken: string | null) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoginModalOpen: false,

      setSession: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: !!user && !!accessToken,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      logout: async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          set({ user: null, accessToken: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      openLoginModal: () =>
        set({
          isLoginModalOpen: true,
        }),

      closeLoginModal: () =>
        set({
          isLoginModalOpen: false,
        }),

      checkAuthStatus: async () => {
        try {
          const supabase = createClient();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error || !session) {
            set({ user: null, accessToken: null, isAuthenticated: false });
            return;
          }

          const supabaseUser = session.user;
          const user: User = {
            id: supabaseUser.id,
            name:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              'User',
            email: supabaseUser.email || '',
            avatar:
              supabaseUser.user_metadata?.avatar_url ||
              supabaseUser.user_metadata?.picture,
          };

          set({
            user,
            accessToken: session.access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Failed to check auth status:', error);
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    },
  ),
);
