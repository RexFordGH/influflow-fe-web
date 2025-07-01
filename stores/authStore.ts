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
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoginModalOpen: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

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
          // TODO: 调用后端API检查用户登录状态
          // const response = await fetch('/api/auth/me');
          // if (response.ok) {
          //   const user = await response.json();
          //   set({ user, isAuthenticated: true });
          // } else {
          //   set({ user: null, isAuthenticated: false });
          // }

          // 临时模拟：检查localStorage中是否有用户信息
          const { user } = get();
          if (user) {
            set({ isAuthenticated: true });
          }
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
