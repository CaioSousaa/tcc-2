import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join(".");
    res.status(400).json({
      message: field ? `${field}: ${issue.message}` : issue?.message,
      issues: err.issues,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Erro interno do servidor" });
};
