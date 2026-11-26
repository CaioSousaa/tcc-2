import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../utils/HttpError";
import { verifyToken } from "../utils/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(unauthorized());
  }

  try {
    res.locals.userId = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(unauthorized("Sessão expirada ou inválida"));
  }
}
