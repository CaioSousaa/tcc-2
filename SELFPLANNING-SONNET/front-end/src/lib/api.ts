import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthResponse } from "./types";

const REFRESH_KEY = "kanban.refreshToken";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333",
});

let accessToken: string | null = null;
let onSessionLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

export function readRefreshToken(): string | null {
  try {
    return (
      window.localStorage.getItem(REFRESH_KEY) ??
      window.sessionStorage.getItem(REFRESH_KEY)
    );
  } catch {
    return null;
  }
}

export function storeRefreshToken(token: string, persistent: boolean) {
  clearRefreshToken();
  try {
    (persistent ? window.localStorage : window.sessionStorage).setItem(
      REFRESH_KEY,
      token,
    );
  } catch {}
}

export function clearRefreshToken() {
  try {
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  } catch {}
}

function isPersistent(): boolean {
  try {
    return window.localStorage.getItem(REFRESH_KEY) !== null;
  } catch {
    return false;
  }
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

export async function refreshSession(): Promise<AuthResponse> {
  const token = readRefreshToken();
  if (!token) throw new Error("no refresh token");
  const persistent = isPersistent();
  const { data } = await axios.post<AuthResponse>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken: token },
  );
  setAccessToken(data.accessToken);
  storeRefreshToken(data.refreshToken, persistent);
  return data;
}

function refreshOnce(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((d) => d.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshOnce();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearRefreshToken();
        setAccessToken(null);
        onSessionLost?.();
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!error.response) return "Não foi possível conectar ao servidor.";
  }
  return fallback;
}
