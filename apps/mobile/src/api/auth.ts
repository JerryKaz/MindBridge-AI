import type { AuthResponse, LoginInput, RegisterInput } from '@mindbridge/shared';
import { useAuth } from '@/store/auth';
import { api, refreshSession } from './client';

export async function login(input: LoginInput) {
  const res = await api<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false });
  await useAuth.getState().setSession(res.tokens, res.user);
  return res.user;
}

export async function register(input: RegisterInput) {
  const res = await api<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false });
  await useAuth.getState().setSession(res.tokens, res.user);
  return res.user;
}

export async function logout() {
  const { refreshToken, clear } = useAuth.getState();
  if (refreshToken) await api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(() => undefined);
  await clear();
}

/** Restores a session on app start using the stored refresh token. */
export async function restoreSession(): Promise<void> {
  const state = useAuth.getState();
  const stored = await state.hydrate();
  if (!stored || !(await refreshSession())) {
    await state.clear();
    return;
  }
  try {
    const user = await api<AuthResponse['user']>('/students/me');
    useAuth.getState().setUser(user);
  } catch {
    await useAuth.getState().clear();
  }
}

export const forgotPassword = (email: string) =>
  api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });

export const resetPassword = (token: string, password: string) =>
  api<void>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false });
