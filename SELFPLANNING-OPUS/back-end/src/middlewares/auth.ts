import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const ensureAuthenticated: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const [scheme, token] = header?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Token de acesso ausente", 401);
  }

  const userId = verifyAccessToken(token);
  if (!userId) {
    throw new AppError("Token de acesso inválido ou expirado", 401);
  }

  req.userId = userId;
  next();
};
