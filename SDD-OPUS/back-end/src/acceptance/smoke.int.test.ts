import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Api, registerUser, resetDatabase, startServer, stopServer } from "./harness";

describe("smoke", () => {
  beforeAll(startServer);
  afterAll(stopServer);

  it("serves health and registers a user", async () => {
    const health = await new Api().get("/health");
    expect(health.status).toBe(200);
    await resetDatabase();
    const user = await registerUser("Ana");
    const me = await user.api.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);
  });
});
