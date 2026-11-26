import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { createBoardSchema, updateBoardSchema } from "./boards.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("createBoardSchema (CA-Q1, CA-Q2)", () => {
  it("accepts a name with an optional description", () => {
    expect(parse(createBoardSchema, { name: "Sprint 1" })).toEqual({ name: "Sprint 1" });
    expect(parse(createBoardSchema, { name: "Sprint 1", description: "Meta" })).toEqual({
      name: "Sprint 1",
      description: "Meta",
    });
  });

  it("requires a name; whitespace-only counts as empty", () => {
    expect(fieldsOf(() => parse(createBoardSchema, {}))).toHaveProperty("name");
    expect(fieldsOf(() => parse(createBoardSchema, { name: "" }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(createBoardSchema, { name: "   " }))).toHaveProperty("name");
  });

  it("trims the name and enforces 100 characters (spec §5)", () => {
    expect(parse(createBoardSchema, { name: "  Sprint  " }).name).toBe("Sprint");
    expect(parse(createBoardSchema, { name: "a".repeat(100) }).name).toHaveLength(100);
    expect(fieldsOf(() => parse(createBoardSchema, { name: "a".repeat(101) }))).toHaveProperty("name");
  });

  it("limits the description to 500 characters and stores blank as null", () => {
    expect(parse(createBoardSchema, { name: "x", description: "d".repeat(500) }).description).toHaveLength(500);
    expect(fieldsOf(() => parse(createBoardSchema, { name: "x", description: "d".repeat(501) }))).toHaveProperty(
      "description",
    );
    expect(parse(createBoardSchema, { name: "x", description: "   " }).description).toBeNull();
  });

  it("keeps markup literally (B5)", () => {
    expect(parse(createBoardSchema, { name: "<b>Olá 🚀</b>" }).name).toBe("<b>Olá 🚀</b>");
  });
});

describe("updateBoardSchema (CA-Q4)", () => {
  it("treats absent fields as 'leave unchanged'", () => {
    expect(parse(updateBoardSchema, {})).toEqual({});
    expect(parse(updateBoardSchema, { name: "Novo" })).toEqual({ name: "Novo" });
  });

  it("clears the description with null", () => {
    expect(parse(updateBoardSchema, { description: null })).toEqual({ description: null });
  });

  it("never lets the name be emptied", () => {
    expect(fieldsOf(() => parse(updateBoardSchema, { name: "  " }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(updateBoardSchema, { name: null }))).toHaveProperty("name");
  });
});
