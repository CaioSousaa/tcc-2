import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { createCardSchema, moveCardSchema, updateCardSchema } from "./cards.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

const LIST_ID = "3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f";

describe("createCardSchema (CA-K1, CA-K2)", () => {
  it("accepts a title up to 200 characters, trimmed", () => {
    expect(parse(createCardSchema, { title: "  Escrever testes " })).toEqual({ title: "Escrever testes" });
    expect(parse(createCardSchema, { title: "a".repeat(200) }).title).toHaveLength(200);
  });

  it("rejects missing, whitespace-only and over-long titles", () => {
    expect(fieldsOf(() => parse(createCardSchema, {}))).toHaveProperty("title");
    expect(fieldsOf(() => parse(createCardSchema, { title: "  " }))).toHaveProperty("title");
    expect(fieldsOf(() => parse(createCardSchema, { title: "a".repeat(201) }))).toHaveProperty("title");
  });
});

describe("updateCardSchema (CA-K2, CA-K3, CA-K9, CA-P*)", () => {
  it("treats absent fields as unchanged", () => {
    expect(parse(updateCardSchema, {})).toEqual({});
    expect(parse(updateCardSchema, { completed: true })).toEqual({ completed: true });
  });

  it("never lets the title be emptied or nulled", () => {
    expect(fieldsOf(() => parse(updateCardSchema, { title: "" }))).toHaveProperty("title");
    expect(fieldsOf(() => parse(updateCardSchema, { title: null }))).toHaveProperty("title");
  });

  it("limits the description to 5000 characters and clears it with null/blank", () => {
    expect(parse(updateCardSchema, { description: "d".repeat(5000) }).description).toHaveLength(5000);
    expect(fieldsOf(() => parse(updateCardSchema, { description: "d".repeat(5001) }))).toHaveProperty("description");
    expect(parse(updateCardSchema, { description: null })).toEqual({ description: null });
    expect(parse(updateCardSchema, { description: "  " })).toEqual({ description: null });
  });

  describe("due date (P1, P7, P9, P10, RN-D4)", () => {
    it("accepts real calendar dates, including past ones", () => {
      expect(parse(updateCardSchema, { dueDate: "2026-06-15" })).toEqual({ dueDate: "2026-06-15" });
      expect(parse(updateCardSchema, { dueDate: "2001-01-01" })).toEqual({ dueDate: "2001-01-01" });
      expect(parse(updateCardSchema, { dueDate: "2024-02-29" })).toEqual({ dueDate: "2024-02-29" });
    });

    it("removes the deadline with null", () => {
      expect(parse(updateCardSchema, { dueDate: null })).toEqual({ dueDate: null });
    });

    it("rejects impossible or malformed dates (CA-P9)", () => {
      for (const dueDate of ["2026-02-31", "2025-02-29", "15/06/2026", "2026-6-1", "tomorrow", "", "2026-06-15T10:00:00Z"]) {
        expect(fieldsOf(() => parse(updateCardSchema, { dueDate })), dueDate).toHaveProperty("dueDate");
      }
      expect(fieldsOf(() => parse(updateCardSchema, { dueDate: 20260615 }))).toHaveProperty("dueDate");
    });
  });

  it("only accepts booleans for 'completed'", () => {
    expect(parse(updateCardSchema, { completed: false })).toEqual({ completed: false });
    expect(fieldsOf(() => parse(updateCardSchema, { completed: "true" }))).toHaveProperty("completed");
  });

  it("ignores unknown fields such as board or list ids (R-12)", () => {
    expect(parse(updateCardSchema, { title: "x", boardId: LIST_ID, listId: LIST_ID })).toEqual({ title: "x" });
  });
});

describe("moveCardSchema (CA-K4…CA-K7)", () => {
  it("accepts a list id and an integer position", () => {
    expect(parse(moveCardSchema, { listId: LIST_ID, position: 2 })).toEqual({ listId: LIST_ID, position: 2 });
  });

  it("rejects a malformed list id (B20)", () => {
    expect(fieldsOf(() => parse(moveCardSchema, { listId: "abc", position: 0 }))).toHaveProperty("listId");
    expect(fieldsOf(() => parse(moveCardSchema, { position: 0 }))).toHaveProperty("listId");
  });

  it("rejects a missing or fractional position", () => {
    expect(fieldsOf(() => parse(moveCardSchema, { listId: LIST_ID }))).toHaveProperty("position");
    expect(fieldsOf(() => parse(moveCardSchema, { listId: LIST_ID, position: 0.5 }))).toHaveProperty("position");
  });
});
