import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

// Plan §5.1 / R-20 and spec RN-A3.
describe("password hashing", () => {
  it("produces a self-describing scrypt hash that never contains the password", async () => {
    const hash = await hashPassword("senha-segura-123");
    expect(hash.startsWith("scrypt$32768$8$1$")).toBe(true);
    expect(hash).not.toContain("senha-segura-123");
  });

  it("verifies the correct password and rejects a wrong one (CA-C4, CA-C5)", async () => {
    const hash = await hashPassword("senha-segura-123");
    expect(await verifyPassword("senha-segura-123", hash)).toBe(true);
    expect(await verifyPassword("senha-segura-124", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("uses a different salt for every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("mesma-senha-1"), hashPassword("mesma-senha-1")]);
    expect(a).not.toEqual(b);
    expect(await verifyPassword("mesma-senha-1", a)).toBe(true);
    expect(await verifyPassword("mesma-senha-1", b)).toBe(true);
  });

  it("handles unicode and 128-character passwords", async () => {
    const long = "ç".repeat(128);
    const hash = await hashPassword(long);
    expect(await verifyPassword(long, hash)).toBe(true);
    expect(await verifyPassword("ç".repeat(127), hash)).toBe(false);
  });

  it("treats malformed stored hashes as a failed verification, never as an error", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
    expect(await verifyPassword("x", "scrypt$0$8$1$AAAA$AAAA")).toBe(false);
    expect(await verifyPassword("x", "scrypt$32768$8$1$$")).toBe(false);
  });
});
