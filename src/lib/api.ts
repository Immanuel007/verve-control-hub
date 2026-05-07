import { ApiError, ApiResponse } from '@/types/api';

const DEFAULT_BASE = 'http://quickteller-merchant-ui.test.kube.iswke';
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE;

const TOKEN_KEY = 'verve.token.v1';

export const tokenStore = {
  get: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = opts;
  const url = `${API_BASE_URL}${path}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: '*/*',
    ...headers,
  };
  if (auth) {
    const tok = tokenStore.get();
    if (tok) finalHeaders.Authorization = `Bearer ${tok}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError({
      code: 'NETWORK',
      description: 'Network error. Please check your connection and try again.',
      status: 0,
    });
  }

  if (res.status === 401) {
    tokenStore.set(null);
    window.dispatchEvent(new CustomEvent('verve:unauthorized'));
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError({
      code: String(res.status),
      description: res.statusText || 'Unexpected response from server',
      status: res.status,
    });
  }

  const isOk = res.ok && (payload.code === '200' || payload.code === '00' || payload.code?.toLowerCase?.() === 'success');
  if (!isOk) {
    throw new ApiError({
      code: payload.code ?? String(res.status),
      description: payload.description ?? 'Request failed',
      errors: payload.errors,
      status: res.status,
    });
  }

  return payload.data;
}
