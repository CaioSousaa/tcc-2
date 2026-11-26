import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${problems}`);
}

const values = parsed.data;

export const env = {
  ...values,
  WEB_ORIGIN: values.WEB_ORIGIN.replace(/\/+$/, ""),
  isProduction: values.NODE_ENV === "production",
};
