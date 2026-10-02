import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/** One log line per request: method, path (no query string), status, duration. Plan §5.5. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  const startedAt = process.hrtime.bigint();
  res.setHeader("X-Request-Id", id);

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(`[${id}] ${req.method} ${req.path} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });

  next();
};

/** Authenticated API responses must never be cached (plan §4.1). */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};
