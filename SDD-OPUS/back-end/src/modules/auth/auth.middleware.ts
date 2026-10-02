import type { RequestHandler } from "express";
import { env } from "../../config/env";
import { Errors } from "../../shared/errors";
import type { AuthContext } from "./auth.types";
import { authenticate } from "./auth.service";
import { SESSION_COOKIE, sessionCookieOptions } from "./session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/** Requires a valid session cookie; sets `req.auth`. Everything else is 401 (R-18). */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length === 0) {
    next(Errors.unauthenticated());
    return;
  }

  const session = await authenticate(token);
  if (!session) {
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(env.isProduction), maxAge: undefined });
    next(Errors.unauthenticated());
    return;
  }

  if (session.refreshed) {
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(env.isProduction));
  }
  req.auth = { user: session.user, sessionId: session.sessionId };
  next();
};

/** Returns the authenticated context; only valid on routes behind `requireAuth`. */
export function authOf(req: { auth?: AuthContext }): AuthContext {
  if (!req.auth) throw Errors.unauthenticated();
  return req.auth;
}
