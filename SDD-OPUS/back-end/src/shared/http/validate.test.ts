import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../errors";
import { fieldsFromIssues, parse } from "./validate";

describe("fieldsFromIssues", () => {
  it("keeps the first message per field and uses '_' for form-level issues", () => {
    expect(
      fieldsFromIssues([
        { path: ["name"], message: "a" },
        { path: ["name"], message: "b" },
        { path: ["address", "city"], message: "c" },
        { path: [], message: "d" },
      ]),
    ).toEqual({ name: "a", "address.city": "c", _: "d" });
  });
});

describe("parse", () => {
  const schema = z.object({ name: z.string().trim().min(1, "obrigatório") });

  it("returns the typed, cleaned value", () => {
    expect(parse(schema, { name: "  Ana  " })).toEqual({ name: "Ana" });
  });

  it("drops unknown fields (plan §4.1)", () => {
    expect(parse(schema, { name: "Ana", admin: true })).toEqual({ name: "Ana" });
  });

  it("throws a 400 VALIDATION_ERROR with per-field messages", () => {
    try {
      parse(schema, { name: "   " });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      const appError = error as AppError;
      expect(appError.status).toBe(400);
      expect(appError.code).toBe("VALIDATION_ERROR");
      expect(appError.fields).toEqual({ name: "obrigatório" });
    }
  });

  it("treats a missing body as an empty object", () => {
    expect(() => parse(schema, undefined)).toThrow(AppError);
  });
});
