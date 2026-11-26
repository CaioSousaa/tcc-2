import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities: [__dirname + "/entities/*.{ts,js}"],
  // Apenas desenvolvimento (RT-31). Em produção, usar migrações.
  synchronize: !env.isProduction,
  logging: false,
});
