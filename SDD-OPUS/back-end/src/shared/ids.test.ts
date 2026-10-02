import { describe, expect, it } from "vitest";
import { isUuid } from "./ids";

describe("isUuid (plan §4.1: malformed id is a 404, never a 500)", () => {
  it("accepts UUIDs", () => {
    expect(isUuid("3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("3F2B8C1E-9A4D-4C2B-8E1F-0A1B2C3D4E5F")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isUuid("abc")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5")).toBe(false);
    expect(isUuid("1; DROP TABLE users")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
