import { describe, expect, it } from "vitest";
import { generateToken, hashToken, isExpired, sessionExpiry } from "./session-token";

describe("token de sessão (RT-39)", () => {
  it("guarda apenas o hash SHA-256, que não revela o token", () => {
    const { token, hash } = generateToken();
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashToken(token)).toBe(hash);
  });

  it("gera tokens imprevisíveis e distintos", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken().token));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(token.length).toBeGreaterThanOrEqual(43);
  });
});

describe("expiração da sessão (RN-04, CA-06, CA-07)", () => {
  const login = new Date("2026-10-01T12:00:00Z");

  it("expira 7 dias depois do login", () => {
    expect(sessionExpiry(login, 7).toISOString()).toBe("2026-10-08T12:00:00.000Z");
  });

  it("continua válida antes dos 7 dias", () => {
    const expires = sessionExpiry(login, 7);
    expect(isExpired(expires, new Date("2026-10-08T11:59:59Z"))).toBe(false);
  });

  it("expira exatamente aos 7 dias e depois", () => {
    const expires = sessionExpiry(login, 7);
    expect(isExpired(expires, new Date("2026-10-08T12:00:00Z"))).toBe(true);
    expect(isExpired(expires, new Date("2026-11-01T00:00:00Z"))).toBe(true);
  });

  it("não renova com o uso: validade é fixa a partir do login", () => {
    const expires = sessionExpiry(login, 7);
    expect(sessionExpiry(login, 7).getTime()).toBe(expires.getTime());
  });
});
