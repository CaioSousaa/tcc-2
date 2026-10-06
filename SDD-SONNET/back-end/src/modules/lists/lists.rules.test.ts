import { describe, expect, it } from "vitest";
import { decideListDeletion } from "./lists.rules";
import { deleteListQuerySchema, listBodySchema, moveListSchema } from "./lists.schemas";

const OTHERS = ["m1", "m2"];

describe("exclusão de lista (RF-14, RN-16)", () => {
  it("lista vazia é excluída direto (CA-21)", () => {
    expect(decideListDeletion({ cardCount: 0, otherListIds: OTHERS })).toEqual({ kind: "delete" });
  });

  it("lista vazia ignora a estratégia, mesmo com destino inválido", () => {
    expect(
      decideListDeletion({ cardCount: 0, strategy: "move", targetListId: "x", otherListIds: [] }),
    ).toEqual({ kind: "delete" });
  });

  it("com cards e sem escolha: recusa e informa a quantidade (CA-22)", () => {
    expect(decideListDeletion({ cardCount: 3, otherListIds: OTHERS })).toEqual({
      kind: "needs_choice",
      cardCount: 3,
    });
  });

  it("mover para outra lista do quadro (CA-23)", () => {
    expect(
      decideListDeletion({
        cardCount: 3,
        strategy: "move",
        targetListId: "m1",
        otherListIds: OTHERS,
      }),
    ).toEqual({ kind: "move", targetListId: "m1" });
  });

  it("excluir junto com os cards, por escolha explícita (CA-24)", () => {
    expect(decideListDeletion({ cardCount: 3, strategy: "delete", otherListIds: OTHERS })).toEqual({
      kind: "delete",
    });
  });

  it("destino inexistente, de outro quadro ou ausente é inválido (CB-18, CB-20)", () => {
    for (const targetListId of ["fora", undefined]) {
      expect(
        decideListDeletion({ cardCount: 3, strategy: "move", targetListId, otherListIds: OTHERS }),
      ).toEqual({ kind: "invalid_target" });
    }
  });

  it("única lista com cards: não há destino para mover (CA-26)", () => {
    expect(
      decideListDeletion({ cardCount: 2, strategy: "move", targetListId: "a", otherListIds: [] }),
    ).toEqual({ kind: "invalid_target" });
    expect(decideListDeletion({ cardCount: 2, strategy: "delete", otherListIds: [] })).toEqual({
      kind: "delete",
    });
  });
});

describe("validação de listas (RN-11)", () => {
  it("nome de lista: 1 a 100 caracteres, após trim", () => {
    expect(listBodySchema.parse({ name: " Backlog " }).name).toBe("Backlog");
    expect(listBodySchema.safeParse({ name: "  " }).success).toBe(false);
    expect(listBodySchema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    expect(listBodySchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });

  it("posição de movimento é inteiro não negativo", () => {
    expect(moveListSchema.safeParse({ position: 0 }).success).toBe(true);
    expect(moveListSchema.safeParse({ position: -1 }).success).toBe(false);
    expect(moveListSchema.safeParse({ position: 1.2 }).success).toBe(false);
  });

  it("estratégia de exclusão só aceita delete ou move", () => {
    expect(deleteListQuerySchema.safeParse({}).success).toBe(true);
    expect(deleteListQuerySchema.safeParse({ strategy: "move", targetListId: "x" }).success).toBe(
      true,
    );
    expect(deleteListQuerySchema.safeParse({ strategy: "apagar" }).success).toBe(false);
  });
});
