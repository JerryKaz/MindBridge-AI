import type { ApiError, AuthTokens } from '@mindbridge/shared';
import { useAuth } from '@/store/auth';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Single-flight refresh so parallel 401s trigger only one rotation. */
async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const { refreshToken, setSession, clear } = useAuth.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clear();
        return false;
      }
      const body = (await res.json()) as { tokens: AuthTokens };
      await setSession(body.tokens);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const doFetch = () => {
    const token = useAuth.getState().accessToken;
    return fetch(`${API_URL}/api/v1${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(init.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    throw new ApiRequestError(0, 'NETWORK', "We couldn't reach MindBridge. Check your connection and try again.");
  }
  if (res.status === 401 && init.auth !== false && (await refreshSession())) res = await doFetch();
  if (res.status === 204) return undefined as T;

  const body = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) {
    const err = body?.error;
    throw new ApiRequestError(res.status, err?.code ?? 'ERROR', err?.message ?? 'Something went wrong', err?.details);
  }
  return body as T;
}

export { refreshSession };
