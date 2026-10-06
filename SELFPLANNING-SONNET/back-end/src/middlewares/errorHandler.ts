import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, ...err.extra });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message ?? "Dados inválidos",
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
}
