import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas";

const valid = { name: "Ana", email: "ana@exemplo.com", password: "12345678" };

describe("cadastro (CA-01, CA-03, RN-02)", () => {
  it("aceita dados válidos", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("normaliza o e-mail: ANA@exemplo.com vira o mesmo identificador (CA-02, RN-01)", () => {
    const result = registerSchema.parse({ ...valid, email: "  ANA@Exemplo.com " });
    expect(result.email).toBe("ana@exemplo.com");
  });

  it("recusa nome vazio ou só com espaços", () => {
    expect(registerSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("recusa nome acima de 80 caracteres", () => {
    expect(registerSchema.safeParse({ ...valid, name: "a".repeat(81) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: "a".repeat(80) }).success).toBe(true);
  });

  it("recusa e-mail inválido", () => {
    expect(registerSchema.safeParse({ ...valid, email: "ana@" }).success).toBe(false);
  });

  it("recusa senha curta", () => {
    expect(registerSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
  });

  it("indica qual campo está inválido (CA-03)", () => {
    const result = registerSchema.safeParse({ name: "", email: "x", password: "1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["name", "email", "password"]));
    }
  });
});

describe("login (CA-04, CA-05)", () => {
  it("normaliza o e-mail", () => {
    expect(loginSchema.parse({ email: " ANA@exemplo.com ", password: "x" }).email).toBe(
      "ana@exemplo.com",
    );
  });

  it("exige e-mail e senha", () => {
    expect(loginSchema.safeParse({ email: "ana@exemplo.com" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "ana@exemplo.com", password: "" }).success).toBe(false);
  });
});
