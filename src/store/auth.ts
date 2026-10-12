import { create } from 'zustand';
import type { UserProfile } from '../api/types';

const ACCESS_KEY = 'travel.accessToken';
const REFRESH_KEY = 'travel.refreshToken';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
  user: null,
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

export const isLoggedIn = () => Boolean(useAuthStore.getState().accessToken);
