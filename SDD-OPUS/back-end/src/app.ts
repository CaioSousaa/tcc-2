import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { Errors } from "./shared/errors";
import { errorHandler } from "./shared/http/errorHandler";
import { noStore, requestLogger } from "./shared/http/middlewares";
import { originCheck } from "./shared/http/originCheck";
import { generalLimiter } from "./shared/http/rateLimiters";
import { apiRouter } from "./modules";

/** Builds the Express app without opening a port or touching the database. */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(requestLogger);
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(noStore);
  app.use(generalLimiter);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(originCheck(env.WEB_ORIGIN));

  app.use("/api", apiRouter);

  app.use((_req, _res, next) => next(Errors.notFound()));
  app.use(errorHandler);

  return app;
}
