import "dotenv/config";
import { Client } from "pg";
import { TEST_DATABASE } from "./testDatabase";

export default async function setup(): Promise<void> {
  const admin = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
  });
  await admin.connect();
  try {
    const found = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DATABASE]);
    if (found.rowCount === 0) await admin.query(`CREATE DATABASE "${TEST_DATABASE}"`);
  } finally {
    await admin.end();
  }
}
