import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../lib/apiClient';
// Import the store (not just the hook) so we can call getState() outside React
import useCartStore from './cartStore';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      user: null,
      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      fetchUser: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({ user: data });
        } catch {
          // If fetch fails, don't crash — user info just won't be available
        }
      },
      logout: () => {
        // Clear cart in-memory state AND localStorage so items disappear immediately
        useCartStore.getState().clearAll();
        set({ accessToken: null, isAuthenticated: false, user: null });
        apiClient.post('/auth/logout').catch(() => {});
      },
    }),
    { name: 'auth-storage' }
  )
);

export default useAuthStore;
