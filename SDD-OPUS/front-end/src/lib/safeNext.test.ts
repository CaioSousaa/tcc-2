import { describe, expect, it } from "vitest";
import { DEFAULT_LANDING, safeNext } from "./safeNext";

// CA-C9: after login the user lands on the originally requested page — but never off-site.
describe("safeNext", () => {
  it("keeps same-site absolute paths, with query strings", () => {
    expect(safeNext("/boards/abc")).toBe("/boards/abc");
    expect(safeNext("/boards/abc?card=123")).toBe("/boards/abc?card=123");
  });

  it("falls back when missing", () => {
    expect(safeNext(null)).toBe(DEFAULT_LANDING);
    expect(safeNext(undefined)).toBe(DEFAULT_LANDING);
    expect(safeNext("")).toBe(DEFAULT_LANDING);
  });

  it("rejects absolute and protocol-relative URLs (open redirect)", () => {
    expect(safeNext("https://evil.test")).toBe(DEFAULT_LANDING);
    expect(safeNext("//evil.test")).toBe(DEFAULT_LANDING);
    expect(safeNext("/\\evil.test")).toBe(DEFAULT_LANDING);
    expect(safeNext("javascript:alert(1)")).toBe(DEFAULT_LANDING);
    expect(safeNext("boards")).toBe(DEFAULT_LANDING);
  });

  it("rejects control characters", () => {
    expect(safeNext("/boards\n/evil")).toBe(DEFAULT_LANDING);
  });

  it("never sends the user back to the auth pages", () => {
    expect(safeNext("/login")).toBe(DEFAULT_LANDING);
    expect(safeNext("/register?next=/boards")).toBe(DEFAULT_LANDING);
  });

  it("supports a custom fallback", () => {
    expect(safeNext(null, "/x")).toBe("/x");
  });
});
