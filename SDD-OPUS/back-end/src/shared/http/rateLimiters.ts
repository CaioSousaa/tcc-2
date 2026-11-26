import { rateLimit } from "express-rate-limit";
import { Errors } from "../errors";

// Plan §5.3: auth routes 20 requests / 15 min per IP; everything else 300 / min per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(Errors.rateLimited()),
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(Errors.rateLimited()),
});
