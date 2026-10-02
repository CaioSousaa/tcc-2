import { describe, expect, it } from "vitest";
import {
  SESSION_TOUCH_INTERVAL_MS,
  SESSION_TTL_MS,
  computeExpiry,
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  sessionCookieOptions,
  shouldRefreshSession,
} from "./session";

const DAY = 24 * 60 * 60 * 1000;

describe("session token (plan §5.2)", () => {
  it("generates unguessable, unique, URL-safe tokens", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes in base64url
  });

  it("stores only a stable SHA-256 hex digest, never the token", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toEqual(hashSessionToken(token));
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token + "x")).not.toEqual(hash);
  });
});

describe("session expiry (RN-A4, CA-C6, CA-C7)", () => {
  it("lasts 30 days", () => {
    expect(SESSION_TTL_MS).toBe(30 * DAY);
    const now = new Date("2026-06-10T12:00:00Z");
    expect(computeExpiry(now).getTime() - now.getTime()).toBe(30 * DAY);
  });

  it("is valid before expiry and expired at or after it", () => {
    const expiresAt = new Date("2026-07-10T12:00:00Z");
    expect(isSessionExpired(expiresAt, new Date("2026-07-10T11:59:59Z"))).toBe(false);
    expect(isSessionExpired(expiresAt, new Date("2026-07-10T12:00:00Z"))).toBe(true);
    expect(isSessionExpired(expiresAt, new Date("2026-08-01T00:00:00Z"))).toBe(true);
  });

  it("renews the sliding expiry at most once per hour", () => {
    const last = new Date("2026-06-10T12:00:00Z");
    expect(SESSION_TOUCH_INTERVAL_MS).toBe(60 * 60 * 1000);
    expect(shouldRefreshSession(last, new Date("2026-06-10T12:59:59Z"))).toBe(false);
    expect(shouldRefreshSession(last, new Date("2026-06-10T13:00:00Z"))).toBe(true);
  });
});

describe("session cookie (R-19)", () => {
  it("is HttpOnly, SameSite=Lax, site-wide and lasts 30 days", () => {
    const options = sessionCookieOptions(false);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: false });
    expect(options.maxAge).toBe(SESSION_TTL_MS);
  });

  it("is Secure in production", () => {
    expect(sessionCookieOptions(true).secure).toBe(true);
  });
});
