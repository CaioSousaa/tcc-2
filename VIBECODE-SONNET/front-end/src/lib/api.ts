import axios, { AxiosError } from "axios";
import { authStorage } from "./auth-storage";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/api`,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isAuthRoute = url.startsWith("/auth/login") || url.startsWith("/auth/register");
    if (error.response?.status === 401 && !isAuthRoute) {
      authStorage.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: unknown;
}

export function getApiError(error: unknown): ApiErrorBody & { status?: number } {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return { message: "Não foi possível conectar ao servidor." };
    }
    return { ...error.response.data, status: error.response.status };
  }
  return { message: "Erro inesperado." };
}

export function getErrorMessage(error: unknown, fallback = "Algo deu errado.") {
  return getApiError(error).message ?? fallback;
}
