import type { AuthTokens, StudentProfile } from '@mindbridge/shared';
import { create } from 'zustand';
import { secureStorage } from '@/lib/storage';

const REFRESH_KEY = 'mb.refreshToken';

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  accessToken: string | null;
  refreshToken: string | null;
  user: StudentProfile | null;
  /** Shows the "how MindBridge understood this" panel under replies (demo/transparency). */
  showInsights: boolean;
  setSession: (tokens: AuthTokens, user?: StudentProfile) => Promise<void>;
  setUser: (user: StudentProfile) => void;
  setShowInsights: (v: boolean) => void;
  hydrate: () => Promise<string | null>;
  clear: () => Promise<void>;
}

/**
 * Lightweight client state. The access token is kept in memory only; the
 * refresh token is persisted in secure storage.
 */
export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  user: null,
  showInsights: false,
  async setSession(tokens, user) {
    await secureStorage.set(REFRESH_KEY, tokens.refreshToken);
    set((s) => ({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user ?? s.user,
      status: 'signedIn',
    }));
  },
  setUser: (user) => set({ user }),
  setShowInsights: (showInsights) => set({ showInsights }),
  async hydrate() {
    const refreshToken = await secureStorage.get(REFRESH_KEY);
    set({ refreshToken });
    return refreshToken;
  },
  async clear() {
    await secureStorage.remove(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, user: null, status: 'signedOut' });
  },
}));
