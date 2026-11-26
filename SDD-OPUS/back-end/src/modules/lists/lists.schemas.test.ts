import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import {
  createListSchema,
  deleteListQuerySchema,
  moveListSchema,
  renameListSchema,
} from "./lists.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("list name (CA-L1, CA-L2, CA-L3)", () => {
  it.each([
    ["create", createListSchema],
    ["rename", renameListSchema],
  ])("%s: trims and accepts 1–100 characters", (_name, schema) => {
    expect(parse(schema, { name: "  Revisão " })).toEqual({ name: "Revisão" });
    expect(parse(schema, { name: "a".repeat(100) }).name).toHaveLength(100);
  });

  it.each([
    ["create", createListSchema],
    ["rename", renameListSchema],
  ])("%s: rejects empty, whitespace-only and over-long names", (_name, schema) => {
    expect(fieldsOf(() => parse(schema, {}))).toHaveProperty("name");
    expect(fieldsOf(() => parse(schema, { name: "" }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(schema, { name: "    " }))).toHaveProperty("name");
    expect(fieldsOf(() => parse(schema, { name: "a".repeat(101) }))).toHaveProperty("name");
  });
});

describe("moveListSchema (CA-L4)", () => {
  it("accepts integer positions, including out-of-range ones (clamped by the service)", () => {
    expect(parse(moveListSchema, { position: 0 })).toEqual({ position: 0 });
    expect(parse(moveListSchema, { position: 999 })).toEqual({ position: 999 });
    expect(parse(moveListSchema, { position: -1 })).toEqual({ position: -1 });
  });

  it("rejects missing, fractional and non-numeric positions", () => {
    expect(fieldsOf(() => parse(moveListSchema, {}))).toHaveProperty("position");
    expect(fieldsOf(() => parse(moveListSchema, { position: 1.5 }))).toHaveProperty("position");
    expect(fieldsOf(() => parse(moveListSchema, { position: "1" }))).toHaveProperty("position");
  });
});

describe("deleteListQuerySchema — ?confirmCards (CA-L5…L7)", () => {
  it("defaults to 0 when omitted (an empty list needs no confirmation)", () => {
    expect(parse(deleteListQuerySchema, {})).toEqual({ confirmCards: 0 });
  });

  it("reads the confirmed card count from the query string", () => {
    expect(parse(deleteListQuerySchema, { confirmCards: "3" })).toEqual({ confirmCards: 3 });
  });

  it("rejects negative, fractional and non-numeric values", () => {
    expect(fieldsOf(() => parse(deleteListQuerySchema, { confirmCards: "-1" }))).toHaveProperty("confirmCards");
    expect(fieldsOf(() => parse(deleteListQuerySchema, { confirmCards: "1.5" }))).toHaveProperty("confirmCards");
    expect(fieldsOf(() => parse(deleteListQuerySchema, { confirmCards: "abc" }))).toHaveProperty("confirmCards");
  });
});
