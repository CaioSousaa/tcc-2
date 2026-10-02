import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Token de autenticação ausente", "UNAUTHORIZED");
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const { sub } = verifyToken(token);
    req.userId = sub;
  } catch {
    throw new AppError(401, "Sessão inválida ou expirada", "UNAUTHORIZED");
  }

  next();
}
