import type { RequestHandler } from "express";
import { Errors } from "../errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence (plan §5.3): non-safe requests that carry an Origin header must come from
 * the allowed web origin. Requests without Origin (non-browser clients) pass through.
 */
export function isOriginAllowed(
  method: string,
  origin: string | undefined,
  allowedOrigin: string,
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (origin === undefined) return true;
  return origin === allowedOrigin;
}

export function originCheck(allowedOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (!isOriginAllowed(req.method, req.headers.origin, allowedOrigin)) {
      next(Errors.forbidden());
      return;
    }
    next();
  };
}
