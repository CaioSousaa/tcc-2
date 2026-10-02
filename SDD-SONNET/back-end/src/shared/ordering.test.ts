import { describe, expect, it } from "vitest";
import {
  appendAll,
  clampIndex,
  insertAt,
  isSameOrder,
  moveAcross,
  moveWithin,
  removeId,
  toPositions,
} from "./ordering";

describe("ordem densa (RN-13, RT-09)", () => {
  it("move lista para o início: A,B,C → C,A,B (CA-19)", () => {
    expect(moveWithin(["A", "B", "C"], "C", 0)).toEqual(["C", "A", "B"]);
  });

  it("move card para a primeira posição da mesma lista: 1,2,3 → 3,1,2 (CA-33)", () => {
    expect(moveWithin(["1", "2", "3"], "3", 0)).toEqual(["3", "1", "2"]);
  });

  it("índice é relativo à lista sem o item movido", () => {
    expect(moveWithin(["A", "B", "C", "D"], "A", 2)).toEqual(["B", "C", "A", "D"]);
  });

  it("mover para a posição atual não altera nada (CB-16)", () => {
    const ids = ["A", "B", "C"];
    expect(isSameOrder(moveWithin(ids, "B", 1), ids)).toBe(true);
  });

  it("posição além do fim vai para o final (CB-17)", () => {
    expect(moveWithin(["A", "B", "C"], "A", 99)).toEqual(["B", "C", "A"]);
    expect(clampIndex(99, 3)).toBe(3);
    expect(clampIndex(-5, 3)).toBe(0);
  });

  it("move entre listas para a posição 2 (índice 1) de B (CA-31)", () => {
    const result = moveAcross(["a1", "a2", "a3"], ["b1", "b2"], "a2", 1);
    expect(result.source).toEqual(["a1", "a3"]);
    expect(result.target).toEqual(["b1", "a2", "b2"]);
  });

  it("move para lista vazia: vira o único card (CA-32)", () => {
    const result = moveAcross(["a1"], [], "a1", 0);
    expect(result.source).toEqual([]);
    expect(result.target).toEqual(["a1"]);
  });

  it("não deixa duplicatas nem perde itens ao mover entre listas", () => {
    const result = moveAcross(["a1", "a2"], ["b1", "a1"], "a1", 0);
    const all = [...result.source, ...result.target].sort();
    expect(all).toEqual(["a1", "a2", "b1"]);
  });

  it("posições resultantes são densas a partir de 0", () => {
    const positions = toPositions(moveWithin(["x", "y", "z"], "z", 1));
    expect([...positions.values()]).toEqual([0, 1, 2]);
    expect(positions.get("z")).toBe(1);
  });

  it("remover mantém a ordem relativa e fecha a lacuna (CA-21)", () => {
    expect(removeId(["A", "B", "C"], "B")).toEqual(["A", "C"]);
  });

  it("insere no fim por padrão de criação (CA-18, CA-28)", () => {
    expect(insertAt(["A", "B"], "C", 2)).toEqual(["A", "B", "C"]);
  });

  it("migração de cards na exclusão de lista vai ao fim, na mesma ordem (CA-23)", () => {
    expect(appendAll(["m1", "m2"], ["l1", "l2", "l3"])).toEqual([
      "m1",
      "m2",
      "l1",
      "l2",
      "l3",
    ]);
  });

  it("id ausente não altera a lista", () => {
    expect(moveWithin(["A", "B"], "Z", 0)).toEqual(["A", "B"]);
  });
});
