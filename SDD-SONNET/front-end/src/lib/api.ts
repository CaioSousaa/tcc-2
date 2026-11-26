import axios, { AxiosError } from "axios";
import { safeNextPath } from "./redirect";

export interface FieldError {
  field: string;
  message: string;
}

/** Erro normalizado da API. A interface decide por `code`, nunca pelo texto (RT-35). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: FieldError[] = [],
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  fieldMessage(field: string): string | undefined {
    return this.fields.find((item) => item.field === field)?.message;
  }
}

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: FieldError[];
    [key: string]: unknown;
  };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const body = error.response?.data as ErrorBody | undefined;
    if (body?.error?.code) {
      const { code, message, fields, ...extra } = body.error;
      return new ApiError(
        error.response?.status ?? 0,
        code,
        message ?? "Erro inesperado.",
        fields ?? [],
        extra,
      );
    }
    if (!error.response) {
      return new ApiError(
        0,
        "NETWORK_ERROR",
        "Não foi possível falar com o servidor. A ação não foi concluída.",
      );
    }
  }
  return new ApiError(0, "UNKNOWN", "Erro inesperado. Tente novamente.");
}

const AUTH_PATHS = ["/login", "/register"];

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    // Sessão expirada no meio de uma ação: volta ao login levando o destino (CB-05).
    if (
      apiError.status === 401 &&
      apiError.code === "UNAUTHENTICATED" &&
      typeof window !== "undefined" &&
      !AUTH_PATHS.includes(window.location.pathname)
    ) {
      const next = safeNextPath(window.location.pathname + window.location.search);
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    return Promise.reject(apiError);
  },
);
