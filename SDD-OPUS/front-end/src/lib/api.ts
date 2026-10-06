import axios, { isAxiosError } from "axios";
import { safeNext } from "@/lib/safeNext";

/** The only place that knows the API base URL (R-04). */
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export interface ApiErrorInfo {
  status?: number;
  code?: string;
  message: string;
  fields: Record<string, string>;
  details?: Record<string, unknown>;
}

const FALLBACK_MESSAGE = "Algo deu errado. Tente novamente.";

/** Normalizes any thrown value into the API error contract (plan §4.2). */
export function parseApiError(error: unknown): ApiErrorInfo {
  if (isAxiosError(error)) {
    const body = error.response?.data as
      | { error?: { code?: string; message?: string; fields?: Record<string, string>; details?: Record<string, unknown> } }
      | undefined;
    if (body?.error) {
      return {
        status: error.response?.status,
        code: body.error.code,
        message: body.error.message ?? FALLBACK_MESSAGE,
        fields: body.error.fields ?? {},
        details: body.error.details,
      };
    }
    if (!error.response) {
      return { message: "Não foi possível conectar ao servidor.", fields: {} };
    }
    return { status: error.response.status, message: FALLBACK_MESSAGE, fields: {} };
  }
  return { message: FALLBACK_MESSAGE, fields: {} };
}

export function errorMessage(error: unknown): string {
  return parseApiError(error).message;
}

const PUBLIC_PATHS = ["/login", "/register"];

// Any 401 UNAUTHENTICATED (expired/invalid session, B14) sends the user to the login page
// and brings them back to where they were. Unsaved input is not replayed.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const info = parseApiError(error);
    if (
      typeof window !== "undefined" &&
      info.status === 401 &&
      info.code === "UNAUTHENTICATED" &&
      !PUBLIC_PATHS.includes(window.location.pathname)
    ) {
      const here = window.location.pathname + window.location.search;
      window.location.assign(`/login?next=${encodeURIComponent(safeNext(here))}`);
    }
    return Promise.reject(error);
  },
);
