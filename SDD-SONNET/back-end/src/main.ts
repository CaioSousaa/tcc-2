import "reflect-metadata";
import { env } from "./config/env";
import { createApp } from "./app";
import { AppDataSource } from "./database";
import { purgeExpiredSessions } from "./modules/auth/auth.service";

const PURGE_INTERVAL_MS = 60 * 60 * 1000;

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
    await purgeExpiredSessions();
    setInterval(() => {
      purgeExpiredSessions().catch((error) => console.error("Falha ao limpar sessões:", error));
    }, PURGE_INTERVAL_MS).unref();

    createApp().listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
