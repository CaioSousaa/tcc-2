import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message ?? "Dados inválidos",
      code: "VALIDATION_ERROR",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "JSON inválido", code: "BAD_JSON" });
  }

  console.error(err);
  return res
    .status(500)
    .json({ message: "Erro interno do servidor", code: "INTERNAL_ERROR" });
}
