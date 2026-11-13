import type { ApiError, AuthResponse, AuthTokens, StudentProfile } from '@mindbridge/shared';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const REFRESH_KEY = 'mb.admin.refresh';

/**
 * Admin session: access token in memory; refresh token in sessionStorage so it
 * is cleared when the browser tab closes (shared/office machines).
 */
let accessToken: string | null = null;
let listeners: Array<(u: StudentProfile | null) => void> = [];
let currentUser: StudentProfile | null = null;

export class ApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

function setUser(u: StudentProfile | null) {
  currentUser = u;
  listeners.forEach((l) => l(u));
}
export const getUser = () => currentUser;
export const onUserChange = (l: (u: StudentProfile | null) => void) => {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
};

function storeTokens(t: AuthTokens) {
  accessToken = t.accessToken;
  sessionStorage.setItem(REFRESH_KEY, t.refreshToken);
}

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
    if (!res?.ok) {
      sessionStorage.removeItem(REFRESH_KEY);
      accessToken = null;
      setUser(null);
      return false;
    }
    storeTokens(((await res.json()) as { tokens: AuthTokens }).tokens);
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const go = () =>
    fetch(`${API_URL}/api/v1${path}`, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  let res = await go().catch(() => {
    throw new ApiRequestError(0, 'NETWORK', 'Cannot reach the API');
  });
  if (res.status === 401 && (await refresh())) res = await go();
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) throw new ApiRequestError(res.status, body?.error?.code ?? 'ERROR', body?.error?.message ?? 'Request failed', body?.error?.details);
  return body as T;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json()) as AuthResponse & Partial<ApiError>;
  if (!res.ok) throw new ApiRequestError(res.status, body.error?.code ?? 'ERROR', body.error?.message ?? 'Login failed');
  storeTokens(body.tokens);
  setUser(body.user);
}

export async function restore(): Promise<void> {
  if (!(await refresh())) return;
  try {
    setUser(await api<StudentProfile>('/students/me'));
  } catch {
    setUser(null);
  }
}

export async function logout() {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (refreshToken) await api('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  sessionStorage.removeItem(REFRESH_KEY);
  accessToken = null;
  setUser(null);
}
