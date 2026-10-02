import { describe, expect, it } from "vitest";
import { createCardSchema, moveCardSchema, updateCardSchema } from "./cards.schemas";

describe("criar card (CA-28, CA-29, RN-11)", () => {
  it("aceita título válido e descrição opcional", () => {
    const result = createCardSchema.parse({ title: " Tarefa " });
    expect(result.title).toBe("Tarefa");
    expect(result.description).toBeUndefined();
  });

  it("recusa título vazio, só espaços, ou acima de 200", () => {
    expect(createCardSchema.safeParse({ title: "" }).success).toBe(false);
    expect(createCardSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createCardSchema.safeParse({ title: "a".repeat(200) }).success).toBe(true);
    expect(createCardSchema.safeParse({ title: "a".repeat(201) }).success).toBe(false);
  });

  it("descrição vazia vira null; acima de 5.000 é recusada", () => {
    expect(createCardSchema.parse({ title: "T", description: "  " }).description).toBeNull();
    expect(createCardSchema.safeParse({ title: "T", description: "a".repeat(5000) }).success).toBe(
      true,
    );
    expect(createCardSchema.safeParse({ title: "T", description: "a".repeat(5001) }).success).toBe(
      false,
    );
  });
});

describe("editar card (CA-30, CA-37, RF-35)", () => {
  it("aceita qualquer subconjunto de campos", () => {
    expect(updateCardSchema.safeParse({ title: "Novo" }).success).toBe(true);
    expect(updateCardSchema.safeParse({ completed: true }).success).toBe(true);
    expect(updateCardSchema.safeParse({ description: null }).success).toBe(true);
    expect(updateCardSchema.safeParse({ dueDate: null }).success).toBe(true);
  });

  it("exige ao menos um campo", () => {
    expect(updateCardSchema.safeParse({}).success).toBe(false);
    expect(updateCardSchema.safeParse({ campoDesconhecido: 1 }).success).toBe(false);
  });

  it("concluído deve ser booleano", () => {
    expect(updateCardSchema.safeParse({ completed: "sim" }).success).toBe(false);
  });

  it("prazo aceita data real e remoção (null); recusa data inválida (CA-74, CA-78, CA-82)", () => {
    expect(updateCardSchema.safeParse({ dueDate: "2026-12-31" }).success).toBe(true);
    expect(updateCardSchema.safeParse({ dueDate: "2020-01-01" }).success).toBe(true);
    expect(updateCardSchema.safeParse({ dueDate: "2026-02-30" }).success).toBe(false);
    expect(updateCardSchema.safeParse({ dueDate: "amanhã" }).success).toBe(false);
    expect(updateCardSchema.safeParse({ dueDate: "2025-02-29" }).success).toBe(false);
    expect(updateCardSchema.safeParse({ dueDate: "2024-02-29" }).success).toBe(true);
  });
});

describe("mover card (CA-31, CB-17)", () => {
  it("exige lista de destino e posição inteira não negativa", () => {
    expect(moveCardSchema.safeParse({ listId: "x", position: 0 }).success).toBe(true);
    expect(moveCardSchema.safeParse({ position: 0 }).success).toBe(false);
    expect(moveCardSchema.safeParse({ listId: "x", position: -1 }).success).toBe(false);
    expect(moveCardSchema.safeParse({ listId: "x", position: 0.5 }).success).toBe(false);
  });
});
