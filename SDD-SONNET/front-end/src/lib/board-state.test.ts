import { describe, expect, it } from "vitest";
import {
  appendCardInState,
  findCard,
  indexOfCard,
  moveCardInState,
  moveListInState,
  previewListOrder,
  updateCardSummaryInState,
} from "./board-state";
import type { CardSummary, ListWithCards } from "./types";

function card(id: string, listId: string, position: number): CardSummary {
  return {
    id,
    listId,
    title: id,
    position,
    completed: false,
    dueDate: null,
    labelIds: ["l1"],
    assigneeIds: ["u1"],
    progress: { done: 1, total: 2 },
    commentCount: 3,
    hasDescription: true,
  };
}

function list(id: string, position: number, cardIds: string[]): ListWithCards {
  return { id, name: id, position, cards: cardIds.map((c, i) => card(c, id, i)) };
}

const ids = (l: ListWithCards) => l.cards.map((c) => c.id);

describe("mover listas (CA-19)", () => {
  const lists = [list("A", 0, []), list("B", 1, []), list("C", 2, [])];

  it("C antes de A: ordem C, A, B com posições densas", () => {
    const result = moveListInState(lists, "C", 0);
    expect(result.map((l) => l.id)).toEqual(["C", "A", "B"]);
    expect(result.map((l) => l.position)).toEqual([0, 1, 2]);
  });

  it("não muta a entrada", () => {
    moveListInState(lists, "C", 0);
    expect(lists.map((l) => l.id)).toEqual(["A", "B", "C"]);
  });

  it("lista inexistente não altera nada", () => {
    expect(moveListInState(lists, "Z", 0)).toBe(lists);
  });
});

describe("mover cards (CA-31 a CA-34)", () => {
  const lists = [list("A", 0, ["a1", "a2", "a3"]), list("B", 1, ["b1", "b2"]), list("V", 2, [])];

  it("para a posição 2 de B: aparece como segundo e some de A (CA-31)", () => {
    const result = moveCardInState(lists, "a2", "B", 1);
    expect(ids(result[0])).toEqual(["a1", "a3"]);
    expect(ids(result[1])).toEqual(["b1", "a2", "b2"]);
  });

  it("posições ficam densas, sem lacunas nem duplicatas (CA-31)", () => {
    const result = moveCardInState(lists, "a1", "B", 0);
    for (const l of result) expect(l.cards.map((c) => c.position)).toEqual(l.cards.map((_, i) => i));
  });

  it("para lista vazia: vira o único card (CA-32)", () => {
    const result = moveCardInState(lists, "b1", "V", 0);
    expect(ids(result[2])).toEqual(["b1"]);
    expect(ids(result[1])).toEqual(["b2"]);
  });

  it("para a primeira posição da mesma lista: 1,2,3 → 3,1,2 (CA-33)", () => {
    const result = moveCardInState(lists, "a3", "A", 0);
    expect(ids(result[0])).toEqual(["a3", "a1", "a2"]);
  });

  it("posição além do fim vai para o final (CB-17)", () => {
    const result = moveCardInState(lists, "a1", "B", 99);
    expect(ids(result[1])).toEqual(["b1", "b2", "a1"]);
  });

  it("preserva os dados do card, só troca a lista (CA-34)", () => {
    const moved = findCard(moveCardInState(lists, "a1", "B", 0), "a1");
    expect(moved?.listId).toBe("B");
    expect(moved?.labelIds).toEqual(["l1"]);
    expect(moved?.assigneeIds).toEqual(["u1"]);
    expect(moved?.progress).toEqual({ done: 1, total: 2 });
    expect(moved?.commentCount).toBe(3);
  });

  it("card ou lista inexistente não altera nada (CB-08, CB-09)", () => {
    expect(moveCardInState(lists, "zz", "B", 0)).toBe(lists);
    expect(moveCardInState(lists, "a1", "ZZ", 0)).toBe(lists);
  });

  it("localiza lista e índice do card", () => {
    expect(indexOfCard(lists, "b2")).toEqual({ listId: "B", index: 1 });
    expect(indexOfCard(lists, "zz")).toBeNull();
  });
});

describe("atualizar resumo do card e criar card (CA-28, CA-30, CA-37)", () => {
  const lists = [list("A", 0, ["a1", "a2"]), list("B", 1, [])];

  it("novo card entra no final da lista, não concluído e sem prazo (CA-28)", () => {
    const created = { ...card("n1", "A", 99), title: "Novo" };
    const result = appendCardInState(lists, created);
    expect(ids(result[0])).toEqual(["a1", "a2", "n1"]);
    expect(result[0].cards[2].position).toBe(2);
    expect(ids(result[1])).toEqual([]);
  });

  it("patch altera só o card indicado (CA-30, CA-37)", () => {
    const result = updateCardSummaryInState(lists, "a2", { title: "Outro", completed: true });
    expect(result[0].cards[1].title).toBe("Outro");
    expect(result[0].cards[1].completed).toBe(true);
    expect(result[0].cards[0].title).toBe("a1");
    expect(result[0].cards[0].completed).toBe(false);
  });
});

describe("prévia da ordem das listas (modal de lista)", () => {
  const lists = [list("A", 0, []), list("B", 1, []), list("C", 2, [])];

  it("nova lista na posição 2 entra entre A e B", () => {
    const preview = previewListOrder(lists, null, "Nova", 1);
    expect(preview.map((p) => p.name)).toEqual(["A", "Nova", "B", "C"]);
    expect(preview.filter((p) => p.highlighted).map((p) => p.name)).toEqual(["Nova"]);
  });

  it("mover C para o início", () => {
    expect(previewListOrder(lists, "C", "C", 0).map((p) => p.id)).toEqual(["C", "A", "B"]);
  });

  it("posição além do fim vai para o final", () => {
    expect(previewListOrder(lists, "A", "A", 99).map((p) => p.id)).toEqual(["B", "C", "A"]);
  });

  it("renomear mostra o novo nome no mesmo lugar", () => {
    expect(previewListOrder(lists, "B", "Outro", 1).map((p) => p.name)).toEqual(["A", "Outro", "C"]);
  });
});
