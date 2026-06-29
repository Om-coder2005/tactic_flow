import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loadAuthContext: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  loadAuthContext: async () => {
    try {
      // 1. Check if we already have an active session via httpOnly cookies
      const { user } = await apiClient<{ user: User | null }>('/auth/me');
      
      if (user) {
        set({ isAuthenticated: true, user });
        console.log(`[Auth] Resumed session: ${user.name}`);
        return;
      }
    } catch (e) {
      console.warn('[Auth] No active session found.');
    }
    set({ isAuthenticated: false, user: null });
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    set({ isAuthenticated: false, user: null });
  }
}));
