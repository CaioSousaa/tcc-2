import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/tokens";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Não autenticado");
  }
  try {
    req.userId = verifyAccessToken(header.slice(7)).sub;
  } catch {
    throw new AppError(401, "Token inválido ou expirado");
  }
  next();
}
