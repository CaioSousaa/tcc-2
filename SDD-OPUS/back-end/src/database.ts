import "reflect-metadata";
import { types } from "pg";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { entities } from "./entities";

// PostgreSQL `date` columns (OID 1082) are returned as plain "YYYY-MM-DD" strings,
// never as JS Date objects, so due dates are immune to timezone shifts.
types.setTypeParser(1082, (value: string) => value);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities,
  // Plan §3.5: schema sync is only allowed outside production.
  synchronize: !env.isProduction,
  uuidExtension: "pgcrypto",
  poolSize: env.DB_POOL_SIZE,
  logging: false,
});
