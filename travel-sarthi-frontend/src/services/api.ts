import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env['VITE_API_BASE_URL'] as string | undefined ?? '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token != null && token.length > 0) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Token refresh state ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  for (const prom of failedQueue) {
    if (error != null) {
      prom.reject(error);
    } else if (token != null) {
      prom.resolve(token);
    }
  }
  failedQueue = [];
}

// ─── Response interceptor: handle 401 + token refresh ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken == null || refreshToken.length === 0) {
        clearTokens();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post<{
          data: { accessToken: string; refreshToken: string } | null;
          error: null | { code: string; message: string };
        }>(`${BASE_URL}/auth/refresh`, { refreshToken });

        const newAccess = res.data.data?.accessToken;
        const newRefresh = res.data.data?.refreshToken;
        if (newAccess == null || newRefresh == null) throw new Error('No tokens in refresh response');

        localStorage.setItem('access_token', newAccess);
        localStorage.setItem('refresh_token', newRefresh);
        processQueue(null, newAccess);
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// ─── Typed API error helper ────────────────────────────────────────────────────
export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
