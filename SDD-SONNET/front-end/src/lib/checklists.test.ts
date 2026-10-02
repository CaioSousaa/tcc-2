import { describe, expect, it } from "vitest";
import {
  addChecklistLocal,
  addItemLocal,
  countProgress,
  removeChecklistLocal,
  removeItemLocal,
  renameChecklistLocal,
  updateItemLocal,
} from "./checklists";
import { progressPercent } from "./progress";
import type { Checklist } from "./types";

function checklist(id: string, done: boolean[]): Checklist {
  return {
    id,
    title: id,
    items: done.map((value, index) => ({ id: `${id}-${index}`, text: `item ${index}`, done: value })),
  };
}

const percent = (c: Checklist[]) => progressPercent(countProgress(c));

describe("progresso do card a partir dos checklists (CA-38 a CA-45)", () => {
  it("checklist vazio: sem itens, sem progresso (CA-38)", () => {
    const list = [checklist("k", [])];
    expect(countProgress(list)).toEqual({ done: 0, total: 0 });
    expect(percent(list)).toBeNull();
  });

  it("marcar um segundo item: 1/4 → 2/4, 25% → 50% (CA-39)", () => {
    const before = [checklist("k", [true, false, false, false])];
    expect(countProgress(before)).toEqual({ done: 1, total: 4 });
    expect(percent(before)).toBe(25);

    const after = updateItemLocal(before, "k-1", { done: true });
    expect(countProgress(after)).toEqual({ done: 2, total: 4 });
    expect(percent(after)).toBe(50);
  });

  it("soma todos os checklists: 1/2 + 2/3 = 3/5 = 60% (CA-40)", () => {
    const list = [checklist("a", [true, false]), checklist("b", [true, true, false])];
    expect(countProgress(list)).toEqual({ done: 3, total: 5 });
    expect(percent(list)).toBe(60);
  });

  it("tudo feito é 100%; novo item não feito reduz (CA-41)", () => {
    const full = [checklist("k", [true, true])];
    expect(percent(full)).toBe(100);
    const more = addItemLocal(full, "k", { id: "novo", text: "novo", done: false });
    expect(countProgress(more)).toEqual({ done: 2, total: 3 });
    expect(percent(more)).toBe(67);
  });

  it("excluir item feito reduz numerador e denominador (CA-42)", () => {
    const list = [checklist("k", [true, true, false])];
    const after = removeItemLocal(list, "k-0");
    expect(countProgress(after)).toEqual({ done: 1, total: 2 });
  });

  it("excluir item não feito reduz só o denominador (CA-42)", () => {
    const list = [checklist("k", [true, true, false])];
    const after = removeItemLocal(list, "k-2");
    expect(countProgress(after)).toEqual({ done: 2, total: 2 });
  });

  it("excluir checklist tira seus itens da conta; sem itens, some o progresso (CA-43)", () => {
    const list = [checklist("a", [true, false]), checklist("b", [true])];
    expect(countProgress(removeChecklistLocal(list, "a"))).toEqual({ done: 1, total: 1 });
    const none = removeChecklistLocal(removeChecklistLocal(list, "a"), "b");
    expect(percent(none)).toBeNull();
  });

  it("desmarcar volta a contar como não feito (CA-45)", () => {
    const list = [checklist("k", [true, false])];
    const after = updateItemLocal(list, "k-0", { done: false });
    expect(countProgress(after)).toEqual({ done: 0, total: 2 });
  });

  it("todos os itens feitos não conclui o card sozinho: progresso e concluído são independentes (CB-24)", () => {
    expect(percent([checklist("k", [true, true])])).toBe(100);
    // `completed` não faz parte do cálculo de progresso.
    expect(Object.keys(countProgress([checklist("k", [true])]))).toEqual(["done", "total"]);
  });

  it("renomear e adicionar checklist não alteram o progresso", () => {
    const list = [checklist("k", [true, false])];
    const renamed = renameChecklistLocal(list, "k", "Outro");
    expect(renamed[0].title).toBe("Outro");
    expect(countProgress(renamed)).toEqual(countProgress(list));
    expect(countProgress(addChecklistLocal(list, checklist("n", [])))).toEqual({
      done: 1,
      total: 2,
    });
  });
});
