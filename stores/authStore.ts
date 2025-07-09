import { createClient } from '@/lib/supabase/client';
import { ITone } from '@/utils/profileStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  account_name?: string;
  tone?: ITone;
  tweet_examples?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;

  // Actions
  setSession: (user: User | null, accessToken?: string | null, expiresAt?: number) => void;
  updateUser: (userData: Partial<User>) => void;
  syncProfileFromSupabase: () => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  checkAuthStatus: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  clearTokenCache: () => void;
}

// 内存中的token缓存，不会被持久化到localStorage
interface TokenCache {
  accessToken: string | null;
  expiresAt: number | null;
}

// 全局token缓存，仅存在于内存中
let tokenCache: TokenCache = {
  accessToken: null,
  expiresAt: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoginModalOpen: false,

      setSession: (user, accessToken, expiresAt) => {
        // 更新内存中的token缓存
        if (accessToken && expiresAt) {
          tokenCache.accessToken = accessToken;
          tokenCache.expiresAt = expiresAt;
        } else if (user) {
          // 如果没有提供token信息，从Supabase获取
          const supabase = createClient();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              tokenCache.accessToken = session.access_token;
              tokenCache.expiresAt = session.expires_at ? session.expires_at * 1000 : null;
            }
          });
        } else {
          // 用户登出，清空缓存
          tokenCache.accessToken = null;
          tokenCache.expiresAt = null;
        }

        set({
          user,
          isAuthenticated: !!user,
        });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      syncProfileFromSupabase: async () => {
        try {
          const { loadProfileFromSupabase } = await import(
            '@/utils/supabaseProfile'
          );
          const { data: supabaseProfile, error } =
            await loadProfileFromSupabase();

          if (supabaseProfile && !error) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    account_name: supabaseProfile.account_name,
                    tone: supabaseProfile.tone,
                    bio: supabaseProfile.bio,
                    tweet_examples: supabaseProfile.tweet_examples,
                  }
                : null,
            }));
          }
        } catch (error) {
          console.error('Failed to sync profile from Supabase:', error);
        }
      },

      logout: async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          // 清空内存中的token缓存
          tokenCache.accessToken = null;
          tokenCache.expiresAt = null;
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
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error || !session) {
            set({ user: null, isAuthenticated: false });
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
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Failed to check auth status:', error);
          set({ user: null, isAuthenticated: false });
        }
      },

      getAccessToken: async () => {
        try {
          // 首先检查内存缓存中是否有有效的token
          if (tokenCache.accessToken && tokenCache.expiresAt) {
            const now = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5分钟缓冲时间
            
            // 如果token还没过期（留5分钟缓冲时间），直接返回缓存的token
            if (tokenCache.expiresAt > now + bufferTime) {
              return tokenCache.accessToken;
            }
          }

          // 缓存中没有有效token，从Supabase获取
          const supabase = createClient();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error || !session) {
            // 清空无效的缓存
            tokenCache.accessToken = null;
            tokenCache.expiresAt = null;
            return null;
          }

          // 更新缓存
          tokenCache.accessToken = session.access_token;
          tokenCache.expiresAt = session.expires_at ? session.expires_at * 1000 : null;

          return session.access_token;
        } catch (error) {
          console.error('Failed to get access token:', error);
          // 清空缓存
          tokenCache.accessToken = null;
          tokenCache.expiresAt = null;
          return null;
        }
      },

      clearTokenCache: () => {
        tokenCache.accessToken = null;
        tokenCache.expiresAt = null;
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
