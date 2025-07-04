import { createClient } from '@/lib/supabase/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoginModalOpen: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
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
            data: { user: supabaseUser },
            error,
          } = await supabase.auth.getUser();

          if (error || !supabaseUser) {
            set({ user: null, isAuthenticated: false });
            return;
          }

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

          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to check auth status:', error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
