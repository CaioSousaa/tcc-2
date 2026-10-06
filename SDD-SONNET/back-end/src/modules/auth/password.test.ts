import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hash de senha (RT-38, RN-03)", () => {
  it("verifica a senha correta e recusa a incorreta (CA-04, CA-05)", async () => {
    const hash = await hashPassword("senha-correta-123");
    expect(await verifyPassword("senha-correta-123", hash)).toBe(true);
    expect(await verifyPassword("senha-errada-123", hash)).toBe(false);
  });

  it("não guarda a senha em texto e usa formato autodescritivo", async () => {
    const hash = await hashPassword("minha-senha-secreta");
    expect(hash).not.toContain("minha-senha-secreta");
    expect(hash.startsWith("scrypt$32768$8$1$")).toBe(true);
  });

  it("usa salt aleatório: mesma senha, hashes diferentes", async () => {
    const [a, b] = await Promise.all([hashPassword("mesma-senha-1"), hashPassword("mesma-senha-1")]);
    expect(a).not.toBe(b);
  });

  it("recusa formato de hash desconhecido ou corrompido", async () => {
    expect(await verifyPassword("x", "texto-qualquer")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
    expect(await verifyPassword("x", "scrypt$0$8$1$AAAA$AAAA")).toBe(false);
  });

  it("espaços fazem parte da senha", async () => {
    const hash = await hashPassword("  com espacos  ");
    expect(await verifyPassword("com espacos", hash)).toBe(false);
    expect(await verifyPassword("  com espacos  ", hash)).toBe(true);
  });
});
