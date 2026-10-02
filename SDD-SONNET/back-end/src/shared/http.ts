import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError, errors } from "./errors";
import { fieldsFromZod } from "./validation";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Recusa requisições que alteram dados vindas de origem não permitida (RT-40). */
export const originGuard: RequestHandler = (req, _res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !env.allowedOrigins.includes(origin)) {
    return next(errors.originNotAllowed());
  }
  next();
};

/** Corpo, quando existe, deve ser JSON (RT-40). */
export const requireJsonBody: RequestHandler = (req, _res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  const length = Number(req.get("content-length") ?? 0);
  const hasBody = length > 0 || req.get("transfer-encoding") !== undefined;
  if (hasBody && !req.is("application/json")) {
    return next(
      new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "O corpo da requisição deve ser JSON."),
    );
  }
  next();
};

function limiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    handler: (_req, _res, next) =>
      next(
        new AppError(
          429,
          "TOO_MANY_REQUESTS",
          "Muitas requisições. Aguarde um pouco e tente novamente.",
        ),
      ),
  });
}

export const apiLimiter = limiter(15 * 60 * 1000, env.API_RATE_LIMIT_MAX);
export const authLimiter = limiter(
  env.AUTH_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  env.AUTH_RATE_LIMIT_MAX,
);

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(errors.notFound("Rota"));
};

interface BodyParserError {
  type?: string;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    const fields = fieldsFromZod(error);
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: fields[0]?.message ?? "Dados inválidos.",
        fields,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, ...error.extra },
    });
    return;
  }

  const parserError = error as BodyParserError;
  if (parserError?.type === "entity.parse.failed") {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "JSON inválido." },
    });
    return;
  }
  if (parserError?.type === "entity.too.large") {
    res.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Corpo da requisição grande demais." },
    });
    return;
  }

  console.error("Erro inesperado:", error);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente mais tarde." },
  });
};
