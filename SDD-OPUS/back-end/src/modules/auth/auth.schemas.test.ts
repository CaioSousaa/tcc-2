import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { loginSchema, registerSchema } from "./auth.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("registerSchema (CA-C1, CA-C3)", () => {
  const valid = { name: "Ana", email: "ana@ex.com", password: "12345678" };

  it("accepts valid data", () => {
    expect(parse(registerSchema, valid)).toEqual(valid);
  });

  it("normalizes e-mail: trimmed and lower-case (RN-A1, CA-C2)", () => {
    expect(parse(registerSchema, { ...valid, email: "  ANA@Ex.COM " }).email).toBe("ana@ex.com");
  });

  it("trims the name and rejects an empty or over-long one", () => {
    expect(parse(registerSchema, { ...valid, name: "  Ana  " }).name).toBe("Ana");
    expect(fieldsOf(() => parse(registerSchema, { ...valid, name: "   " }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(registerSchema, { ...valid, name: "a".repeat(101) }))).toHaveProperty("name");
    expect(parse(registerSchema, { ...valid, name: "a".repeat(100) }).name).toHaveLength(100);
  });

  it("rejects malformed e-mails (B3)", () => {
    for (const email of ["", "ana", "ana@", "@ex.com", "ana@ex", "a na@ex.com"]) {
      expect(fieldsOf(() => parse(registerSchema, { ...valid, email })), email).toHaveProperty("email");
    }
  });

  it("enforces password length 8–128 without trimming it (RN-A2)", () => {
    expect(fieldsOf(() => parse(registerSchema, { ...valid, password: "1234567" }))).toHaveProperty("password");
    expect(parse(registerSchema, { ...valid, password: "12345678" }).password).toBe("12345678");
    expect(parse(registerSchema, { ...valid, password: "a".repeat(128) }).password).toHaveLength(128);
    expect(fieldsOf(() => parse(registerSchema, { ...valid, password: "a".repeat(129) }))).toHaveProperty("password");
    expect(parse(registerSchema, { ...valid, password: "  espaços  " }).password).toBe("  espaços  ");
  });

  it("reports every invalid field at once", () => {
    const fields = fieldsOf(() => parse(registerSchema, { name: "", email: "x", password: "1" }));
    expect(Object.keys(fields).sort()).toEqual(["email", "name", "password"]);
  });

  it("rejects missing or wrongly typed fields", () => {
    expect(Object.keys(fieldsOf(() => parse(registerSchema, {}))).sort()).toEqual(["email", "name", "password"]);
    expect(fieldsOf(() => parse(registerSchema, { ...valid, name: 42 }))).toHaveProperty("name");
  });
});

describe("loginSchema (CA-C4, CA-C5)", () => {
  it("normalizes the e-mail and keeps the password untouched", () => {
    expect(parse(loginSchema, { email: " ANA@ex.com", password: "x" })).toEqual({
      email: "ana@ex.com",
      password: "x",
    });
  });

  it("does not apply the registration length rule to the password", () => {
    expect(parse(loginSchema, { email: "ana@ex.com", password: "x" }).password).toBe("x");
  });

  it("requires both fields and a well-formed e-mail (B3)", () => {
    expect(fieldsOf(() => parse(loginSchema, { email: "ana@ex.com", password: "" }))).toHaveProperty("password");
    expect(fieldsOf(() => parse(loginSchema, { email: "ana", password: "x" }))).toHaveProperty("email");
    expect(Object.keys(fieldsOf(() => parse(loginSchema, {}))).sort()).toEqual(["email", "password"]);
  });
});
