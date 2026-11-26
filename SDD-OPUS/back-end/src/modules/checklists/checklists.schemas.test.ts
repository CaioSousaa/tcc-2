import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { checklistTitleSchema, createItemSchema, updateItemSchema } from "./checklists.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("checklist title (CK1, CK2, CA-CK8)", () => {
  it("accepts 1–100 characters, trimmed", () => {
    expect(parse(checklistTitleSchema, { title: " Entrega " })).toEqual({ title: "Entrega" });
    expect(parse(checklistTitleSchema, { title: "a".repeat(100) }).title).toHaveLength(100);
  });

  it("rejects empty, blank and over-long titles", () => {
    expect(fieldsOf(() => parse(checklistTitleSchema, {}))).toHaveProperty("title");
    expect(fieldsOf(() => parse(checklistTitleSchema, { title: "  " }))).toHaveProperty("title");
    expect(fieldsOf(() => parse(checklistTitleSchema, { title: "a".repeat(101) }))).toHaveProperty("title");
  });
});

describe("checklist item (CA-CK1, CA-CK8)", () => {
  it("accepts 1–200 characters, trimmed", () => {
    expect(parse(createItemSchema, { text: " Revisar " })).toEqual({ text: "Revisar" });
    expect(parse(createItemSchema, { text: "a".repeat(200) }).text).toHaveLength(200);
  });

  it("rejects empty, blank and over-long texts", () => {
    expect(fieldsOf(() => parse(createItemSchema, { text: "" }))).toHaveProperty("text");
    expect(fieldsOf(() => parse(createItemSchema, { text: "   " }))).toHaveProperty("text");
    expect(fieldsOf(() => parse(createItemSchema, { text: "a".repeat(201) }))).toHaveProperty("text");
  });

  it("updates text and checked state independently (CA-CK2, CA-CK3)", () => {
    expect(parse(updateItemSchema, { checked: true })).toEqual({ checked: true });
    expect(parse(updateItemSchema, { checked: false })).toEqual({ checked: false });
    expect(parse(updateItemSchema, { text: "Novo texto" })).toEqual({ text: "Novo texto" });
    expect(parse(updateItemSchema, {})).toEqual({});
  });

  it("rejects a blank text or a non-boolean checked flag on update", () => {
    expect(fieldsOf(() => parse(updateItemSchema, { text: " " }))).toHaveProperty("text");
    expect(fieldsOf(() => parse(updateItemSchema, { checked: "yes" }))).toHaveProperty("checked");
    expect(fieldsOf(() => parse(updateItemSchema, { checked: 1 }))).toHaveProperty("checked");
  });
});
