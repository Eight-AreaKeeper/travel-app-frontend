import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';
import type { ApiResponse } from './types';
import { ApiError } from './types';

export const http = axios.create({ baseURL: '/api/v1', timeout: 10000 });

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new ApiError(40100, 'Not logged in');
  const res = await axios.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
    '/api/v1/auth/refresh',
    { refreshToken },
  );
  // The backend reports business errors as HTTP 200 + non-zero code, so check the body, not just the status
  if (res.data?.code !== 0 || !res.data.data?.accessToken) {
    throw new ApiError(res.data?.code ?? 40100, res.data?.message ?? 'Login expired, please log in again');
  }
  const accessToken = res.data.data.accessToken;
  useAuthStore.getState().setTokens(accessToken, refreshToken);
  return accessToken;
}

/** A blob request (e.g. PDF export) that failed comes back as a JSON body; read it so the real error surfaces */
async function readBody(res: AxiosResponse): Promise<unknown> {
  const data = res.data;
  if (data instanceof Blob && data.type.includes('application/json')) {
    try {
      return JSON.parse(await data.text());
    } catch {
      return null;
    }
  }
  return data;
}

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  return typeof body === 'object' && body !== null && typeof (body as { code?: unknown }).code === 'number';
}

/** Retries the request once with a fresh access token when the backend says the login is gone */
async function retryWithRefresh(config: RetriableConfig | undefined) {
  if (!config || config._retried || !useAuthStore.getState().refreshToken) return null;
  config._retried = true;
  try {
    refreshing = refreshing ?? refreshAccessToken();
    const token = await refreshing;
    config.headers.Authorization = `Bearer ${token}`;
    return http.request(config);
  } catch {
    useAuthStore.getState().logout();
    return null;
  } finally {
    refreshing = null;
  }
}

http.interceptors.response.use(
  async (res) => {
    const body = await readBody(res);
    // Success is code === 0; GlobalExceptionHandler returns errors with HTTP 200, so they land here too
    if (!isApiResponse(body) || body.code === 0) return res;
    if (body.code === 40100) {
      const retried = await retryWithRefresh(res.config as RetriableConfig);
      if (retried) return retried;
    }
    throw new ApiError(body.code, body.message || 'Request failed');
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    if (error instanceof ApiError) throw error;
    const status = error.response?.status;
    const body = error.response ? await readBody(error.response) : null;
    const businessCode = isApiResponse(body) ? body.code : undefined;
    if (status === 401 || businessCode === 40100) {
      const retried = await retryWithRefresh(error.config as RetriableConfig);
      if (retried) return retried;
    }
    const message =
      (isApiResponse(body) && body.message) ||
      (error.response ? `Request failed (HTTP ${status})` : 'Cannot reach the backend, is it running on port 8080?');
    throw new ApiError(businessCode ?? status ?? 50000, message);
  },
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}
