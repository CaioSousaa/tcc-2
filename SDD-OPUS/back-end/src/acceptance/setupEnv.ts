import { TEST_DATABASE } from "./testDatabase";

// Runs before any application module is imported, so env.ts sees the test database.
process.env.POSTGRES_DB = TEST_DATABASE;
process.env.NODE_ENV = "test";
process.env.WEB_ORIGIN = "http://localhost:3000";
process.env.TRUST_PROXY = "1";
