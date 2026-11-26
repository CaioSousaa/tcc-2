import type { CookieOptions } from "express";
import { env } from "../../config/env";

export const SESSION_COOKIE = "session";

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  };
}
