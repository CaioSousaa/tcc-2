import { describe, expect, it } from "vitest";
import { checklistBodySchema, itemCreateSchema, itemUpdateSchema } from "./checklists.schemas";

describe("checklist e itens (CA-38, CA-44, RN-19)", () => {
  it("título válido, com trim", () => {
    expect(checklistBodySchema.parse({ title: " Entrega " }).title).toBe("Entrega");
  });

  it("recusa título e item vazios ou só com espaços", () => {
    expect(checklistBodySchema.safeParse({ title: "" }).success).toBe(false);
    expect(checklistBodySchema.safeParse({ title: "   " }).success).toBe(false);
    expect(itemCreateSchema.safeParse({ text: "" }).success).toBe(false);
    expect(itemCreateSchema.safeParse({ text: "  " }).success).toBe(false);
  });

  it("limita título e texto a 200 caracteres", () => {
    expect(checklistBodySchema.safeParse({ title: "a".repeat(200) }).success).toBe(true);
    expect(checklistBodySchema.safeParse({ title: "a".repeat(201) }).success).toBe(false);
    expect(itemCreateSchema.safeParse({ text: "a".repeat(200) }).success).toBe(true);
    expect(itemCreateSchema.safeParse({ text: "a".repeat(201) }).success).toBe(false);
  });

  it("marcar e desmarcar são estados explícitos (CA-39, CA-45, CB-25)", () => {
    expect(itemUpdateSchema.parse({ done: true })).toEqual({ done: true });
    expect(itemUpdateSchema.parse({ done: false })).toEqual({ done: false });
  });

  it("edição de item exige ao menos um campo e valida o tipo", () => {
    expect(itemUpdateSchema.safeParse({}).success).toBe(false);
    expect(itemUpdateSchema.safeParse({ done: "sim" }).success).toBe(false);
    expect(itemUpdateSchema.safeParse({ text: "Novo texto" }).success).toBe(true);
    expect(itemUpdateSchema.safeParse({ text: " " }).success).toBe(false);
  });
});
