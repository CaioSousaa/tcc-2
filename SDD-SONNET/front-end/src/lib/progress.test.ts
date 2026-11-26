import { describe, expect, it } from "vitest";
import { progressPercent } from "./progress";

describe("progresso do card (RN-20)", () => {
  it("1/4 = 25% e 2/4 = 50% (CA-39)", () => {
    expect(progressPercent({ done: 1, total: 4 })).toBe(25);
    expect(progressPercent({ done: 2, total: 4 })).toBe(50);
  });

  it("3/5 = 60% somando checklists (CA-40)", () => {
    expect(progressPercent({ done: 3, total: 5 })).toBe(60);
  });

  it("todos feitos = 100%; novo item não feito reduz (CA-41)", () => {
    expect(progressPercent({ done: 4, total: 4 })).toBe(100);
    expect(progressPercent({ done: 4, total: 5 })).toBe(80);
  });

  it("excluir item feito reduz numerador e denominador; não feito só o denominador (CA-42)", () => {
    expect(progressPercent({ done: 2, total: 4 })).toBe(50);
    expect(progressPercent({ done: 1, total: 3 })).toBe(33);
    expect(progressPercent({ done: 2, total: 3 })).toBe(67);
  });

  it("sem itens não há progresso: nem 0% nem 100% (CA-38, CA-43, CB-24)", () => {
    expect(progressPercent({ done: 0, total: 0 })).toBeNull();
  });

  it("zero feitos de alguns itens é 0%", () => {
    expect(progressPercent({ done: 0, total: 3 })).toBe(0);
  });

  it("metades arredondam para cima", () => {
    expect(progressPercent({ done: 1, total: 8 })).toBe(13);
  });
});
