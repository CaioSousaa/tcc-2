import { describe, expect, it } from "vitest";
import { isRealDate } from "./dates";

describe("isRealDate (CA-P9, B4)", () => {
  it("accepts real calendar dates", () => {
    expect(isRealDate("2026-06-15")).toBe(true);
    expect(isRealDate("2024-02-29")).toBe(true);
    expect(isRealDate("2026-12-31")).toBe(true);
  });

  it("rejects dates that do not exist", () => {
    expect(isRealDate("2026-02-31")).toBe(false);
    expect(isRealDate("2025-02-29")).toBe(false);
    expect(isRealDate("2026-04-31")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
    expect(isRealDate("2026-00-10")).toBe(false);
    expect(isRealDate("2026-06-00")).toBe(false);
  });

  it("rejects malformed values", () => {
    expect(isRealDate("")).toBe(false);
    expect(isRealDate("15/06/2026")).toBe(false);
    expect(isRealDate("2026-6-5")).toBe(false);
    expect(isRealDate("2026-06-15T00:00:00Z")).toBe(false);
  });
});
