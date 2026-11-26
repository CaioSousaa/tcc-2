import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { LABEL_COLORS } from "../../shared/palette";
import { createLabelSchema, updateLabelSchema } from "./labels.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("createLabelSchema (E1, CA-E1, CA-E3)", () => {
  it("accepts a name and every palette color", () => {
    for (const color of LABEL_COLORS) {
      expect(parse(createLabelSchema, { name: "Urgente", color })).toEqual({ name: "Urgente", color });
    }
  });

  it("trims the name and allows up to 30 characters", () => {
    expect(parse(createLabelSchema, { name: "  Bug ", color: "red" }).name).toBe("Bug");
    expect(parse(createLabelSchema, { name: "a".repeat(30), color: "red" }).name).toHaveLength(30);
  });

  it("rejects an empty, blank or over-long name", () => {
    expect(fieldsOf(() => parse(createLabelSchema, { name: "", color: "red" }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(createLabelSchema, { name: "   ", color: "red" }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(createLabelSchema, { name: "a".repeat(31), color: "red" }))).toHaveProperty("name");
  });

  it("rejects colors outside the palette", () => {
    for (const color of ["#ff0000", "RED", "vermelho", "", 1]) {
      expect(fieldsOf(() => parse(createLabelSchema, { name: "x", color })), String(color)).toHaveProperty("color");
    }
    expect(fieldsOf(() => parse(createLabelSchema, { name: "x" }))).toHaveProperty("color");
  });
});

describe("updateLabelSchema (E2, CA-E6)", () => {
  it("allows changing only the name or only the color", () => {
    expect(parse(updateLabelSchema, { name: "Novo" })).toEqual({ name: "Novo" });
    expect(parse(updateLabelSchema, { color: "blue" })).toEqual({ color: "blue" });
    expect(parse(updateLabelSchema, {})).toEqual({});
  });

  it("still validates what is sent", () => {
    expect(fieldsOf(() => parse(updateLabelSchema, { name: " " }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(updateLabelSchema, { color: "neon" }))).toHaveProperty("color");
  });
});
