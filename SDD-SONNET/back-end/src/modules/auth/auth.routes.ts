import { Router } from "express";
import { authLimiter } from "../../shared/http";
import { loginSchema, registerSchema } from "./auth.schemas";
import { sessionCookieOptions, SESSION_COOKIE } from "./auth.cookie";
import { currentUser, requireAuth } from "./auth.middleware";
import * as service from "./auth.service";

export const authRouter = Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const grant = await service.register(input);
  res
    .cookie(SESSION_COOKIE, grant.token, { ...sessionCookieOptions(), expires: grant.expiresAt })
    .status(201)
    .json({ user: grant.user });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const grant = await service.login(input);
  res
    .cookie(SESSION_COOKIE, grant.token, { ...sessionCookieOptions(), expires: grant.expiresAt })
    .json({ user: grant.user });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  await service.logout(req.sessionId as string);
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions()).status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});
