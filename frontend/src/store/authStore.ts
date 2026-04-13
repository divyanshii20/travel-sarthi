import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'travel-sarthi-shared-types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => set({ user: null, isAuthenticated: false }),

      updateUser: (partial) => {
        const current = get().user;
        if (current == null) return;
        set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: 'ts-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
