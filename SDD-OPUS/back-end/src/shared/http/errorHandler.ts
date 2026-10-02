import type { ErrorRequestHandler } from "express";
import { AppError, Errors, errorBody } from "../errors";

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

/** Translates body-parser failures (bad JSON, oversized body) into a 400 domain error. */
function fromBodyParser(err: BodyParserError): AppError | null {
  if (err.type === "entity.parse.failed") {
    return Errors.validation({ _: "Corpo da requisição não é um JSON válido." });
  }
  if (err.type === "entity.too.large") {
    return Errors.validation({ _: "Corpo da requisição muito grande." });
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const domainError = err instanceof AppError ? err : fromBodyParser(err as BodyParserError);
  if (domainError) {
    res.status(domainError.status).json(errorBody(domainError));
    return;
  }

  // Unexpected failure: stack stays in the server log, never in the response (R-17).
  console.error(`[${String(res.getHeader("X-Request-Id") ?? "-")}] ${req.method} ${req.path}`, err);
  const internal = Errors.internal();
  res.status(internal.status).json(errorBody(internal));
};
