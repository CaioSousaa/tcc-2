import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession, loadSession, saveSession } from "./session";
import type { AuthResponse } from "./types";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const session = loadSession();
  if (session && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

class SessionExpiredError extends Error {}

// Uma única renovação em andamento é compartilhada por todas as requisições
// que receberem 401 ao mesmo tempo
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const session = loadSession();
  if (!session) throw new SessionExpiredError();

  try {
    const { data } = await axios.post<AuthResponse>(`${baseURL}/auth/refresh`, {
      refreshToken: session.refreshToken,
    });
    saveSession({ ...session, ...data });
    return data.accessToken;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      throw new SessionExpiredError();
    }
    throw error;
  }
}

function redirectToLogin() {
  clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => original?.url === route);

    if (error.response?.status !== 401 || !original || original._retry || isPublicAuthRoute) {
      throw error;
    }

    original._retry = true;
    try {
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) {
        redirectToLogin();
      }
      throw error;
    }
  },
);

export function errorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!error.response) return "Não foi possível conectar ao servidor.";
  }
  return fallback;
}
