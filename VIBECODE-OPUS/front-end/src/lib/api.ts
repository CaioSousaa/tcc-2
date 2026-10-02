import axios, { AxiosError } from "axios";

const TOKEN_KEY = "kanbo.token";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/api`,
});

/**
 * "Manter-me conectado" stores the token in localStorage (survives browser
 * restarts); otherwise it lives in sessionStorage and ends with the tab.
 */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return (
      window.localStorage.getItem(TOKEN_KEY) ??
      window.sessionStorage.getItem(TOKEN_KEY)
    );
  },
  set(token: string, remember: boolean) {
    this.clear();
    (remember ? window.localStorage : window.sessionStorage).setItem(
      TOKEN_KEY,
      token,
    );
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.startsWith("/auth/")) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: unknown;
}

export function getApiError(error: unknown): ApiErrorBody & { status?: number } {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return { message: "Não foi possível conectar ao servidor" };
    }
    return { ...error.response.data, status: error.response.status };
  }
  return { message: "Erro inesperado" };
}

export function getErrorMessage(error: unknown, fallback = "Algo deu errado") {
  return getApiError(error).message ?? fallback;
}
