import { Router } from "express";
import { env } from "../../config/env";
import { parse } from "../../shared/http/validate";
import { authLimiter } from "../../shared/http/rateLimiters";
import { loginSchema, registerSchema } from "./auth.schemas";
import { authOf, requireAuth } from "./auth.middleware";
import * as authService from "./auth.service";
import { SESSION_COOKIE, sessionCookieOptions } from "./session";

export const authRouter = Router();

authRouter.use("/auth", authLimiter);

authRouter.post("/auth/register", async (req, res) => {
  const input = parse(registerSchema, req.body);
  const { user, token } = await authService.register(input);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(env.isProduction));
  res.status(201).json({ user });
});

authRouter.post("/auth/login", async (req, res) => {
  const input = parse(loginSchema, req.body);
  const { user, token } = await authService.login(input);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(env.isProduction));
  res.json({ user });
});

// Idempotent and deliberately not behind requireAuth: an expired session can still log out.
authRouter.post("/auth/logout", async (req, res) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token.length > 0) {
    await authService.logout(token);
  }
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(env.isProduction), maxAge: undefined });
  res.status(204).end();
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: authOf(req).user });
});
