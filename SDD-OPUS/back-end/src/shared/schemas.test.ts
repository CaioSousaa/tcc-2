import { describe, expect, it } from "vitest";
import { z } from "zod";
import { clearableText, requiredText } from "./schemas";

describe("requiredText (spec §5 / B1, B2)", () => {
  const schema = requiredText("Título", 5);

  it("trims and accepts text up to the limit", () => {
    expect(schema.parse("  abc  ")).toBe("abc");
    expect(schema.parse("12345")).toBe("12345");
  });

  it("counts the limit after trimming", () => {
    expect(schema.parse("  12345  ")).toBe("12345");
  });

  it("rejects empty, whitespace-only, over-long and non-string values", () => {
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("     ").success).toBe(false);
    expect(schema.safeParse("123456").success).toBe(false);
    expect(schema.safeParse(10).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("explains the problem in pt-BR, naming the limit (B2)", () => {
    const result = schema.safeParse("123456");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Título deve ter no máximo 5 caracteres.");
  });

  it("does not interpret markup or strip emojis (B5)", () => {
    expect(schema.parse("<i>é")).toBe("<i>é");
    expect(requiredText("x", 10).parse("🚀 ok")).toBe("🚀 ok");
  });
});

describe("clearableText", () => {
  const schema = z.object({ description: clearableText("Descrição", 5) });

  it("leaves a missing value untouched", () => {
    expect(schema.parse({})).toEqual({});
  });

  it("turns null and blank into null (clear)", () => {
    expect(schema.parse({ description: null })).toEqual({ description: null });
    expect(schema.parse({ description: "" })).toEqual({ description: null });
    expect(schema.parse({ description: "   " })).toEqual({ description: null });
  });

  it("keeps real text trimmed and enforces the limit", () => {
    expect(schema.parse({ description: " ab " })).toEqual({ description: "ab" });
    expect(schema.safeParse({ description: "123456" }).success).toBe(false);
  });
});
