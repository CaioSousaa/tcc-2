import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration + acceptance suites: real Express app, real PostgreSQL (a dedicated test database).
export default defineConfig({
  resolve: {
    // Acceptance tests also exercise the front-end's pure rules (progress, overdue, filter)
    // against real API payloads.
    alias: { "@": fileURLToPath(new URL("../front-end/src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/acceptance/**/*.int.test.ts"],
    globalSetup: ["src/acceptance/globalSetup.ts"],
    setupFiles: ["src/acceptance/setupEnv.ts"],
    fileParallelism: false,
    // The app logs one line per request; keep the test output readable.
    onConsoleLog: (log) => !/^\[[0-9a-f-]{36}\] /.test(log),
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
