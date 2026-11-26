import "reflect-metadata";
import { env } from "./config/env";
import { AppDataSource } from "./database";
import { createApp } from "./app";

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    const server = createApp().listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    const shutdown = () => {
      server.close(async () => {
        await AppDataSource.destroy();
        process.exit(0);
      });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
