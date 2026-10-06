import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "./originCheck";

const WEB = "http://localhost:3000";

describe("isOriginAllowed (plan §5.3 CSRF)", () => {
  it("lets safe methods through regardless of origin", () => {
    expect(isOriginAllowed("GET", "http://evil.test", WEB)).toBe(true);
    expect(isOriginAllowed("HEAD", "http://evil.test", WEB)).toBe(true);
    expect(isOriginAllowed("OPTIONS", "http://evil.test", WEB)).toBe(true);
  });

  it("accepts mutations from the web origin", () => {
    expect(isOriginAllowed("POST", WEB, WEB)).toBe(true);
    expect(isOriginAllowed("DELETE", WEB, WEB)).toBe(true);
  });

  it("rejects mutations from any other origin", () => {
    expect(isOriginAllowed("POST", "http://evil.test", WEB)).toBe(false);
    expect(isOriginAllowed("PATCH", "null", WEB)).toBe(false);
    expect(isOriginAllowed("PUT", "http://localhost:3001", WEB)).toBe(false);
  });

  it("allows non-browser clients that send no Origin header", () => {
    expect(isOriginAllowed("POST", undefined, WEB)).toBe(true);
  });
});
