import type { RequestHandler } from "express";
import { AppDataSource } from "../../database";
import { SESSION_COOKIE } from "./auth.cookie";
import { errors } from "../../shared/errors";
import { hashToken } from "./session-token";

/** Exige sessão válida e expõe `req.user` (RT-04). */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length === 0) return next(errors.unauthenticated());

  const rows: { session_id: string; id: string; name: string; email: string }[] =
    await AppDataSource.query(
      `SELECT s.id AS session_id, u.id, u.name, u.email
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
  const row = rows[0];
  if (!row) return next(errors.unauthenticated());

  req.user = { id: row.id, name: row.name, email: row.email };
  req.sessionId = row.session_id;
  next();
};

/** Usuário autenticado; só use depois de `requireAuth`. */
export function currentUser(req: { user?: { id: string; name: string; email: string } }) {
  if (!req.user) throw errors.unauthenticated();
  return req.user;
}
