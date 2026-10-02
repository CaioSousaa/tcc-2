import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { createCommentSchema } from "./comments.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

// CM1, CA-CM1, CA-CM3.
describe("createCommentSchema", () => {
  it("accepts text up to 2000 characters, trimmed", () => {
    expect(parse(createCommentSchema, { body: "  Revisei o PR " })).toEqual({ body: "Revisei o PR" });
    expect(parse(createCommentSchema, { body: "a".repeat(2000) }).body).toHaveLength(2000);
  });

  it("rejects empty, whitespace-only and over-long comments", () => {
    expect(fieldsOf(() => parse(createCommentSchema, {}))).toHaveProperty("body");
    expect(fieldsOf(() => parse(createCommentSchema, { body: "" }))).toHaveProperty("body");
    expect(fieldsOf(() => parse(createCommentSchema, { body: " \n\t " }))).toHaveProperty("body");
    expect(fieldsOf(() => parse(createCommentSchema, { body: "a".repeat(2001) }))).toHaveProperty("body");
  });

  it("stores markup, accents and emojis literally (B5)", () => {
    const body = "<script>alert(1)</script> ação 🚀";
    expect(parse(createCommentSchema, { body }).body).toBe(body);
  });

  it("does not let the client choose the author or the time (CM2)", () => {
    expect(parse(createCommentSchema, { body: "x", authorId: "someone", createdAt: "2020-01-01" })).toEqual({
      body: "x",
    });
  });
});
