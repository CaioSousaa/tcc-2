import { describe, expect, it } from "vitest";
import { boardSummaryText, boardsSubtitle, cardsInBoardText } from "./format";

describe("textos da lista de quadros, como no protótipo (RF-06)", () => {
  it("resumo com atrasados", () => {
    expect(boardSummaryText({ listCount: 5, cardCount: 11, overdueCount: 2 })).toBe(
      "5 listas · 11 cards · 2 atrasados",
    );
  });

  it("omite atrasados quando não há", () => {
    expect(boardSummaryText({ listCount: 4, cardCount: 18, overdueCount: 0 })).toBe(
      "4 listas · 18 cards",
    );
  });

  it("usa singular para 1", () => {
    expect(boardSummaryText({ listCount: 1, cardCount: 1, overdueCount: 1 })).toBe(
      "1 lista · 1 card · 1 atrasado",
    );
  });

  it("quadro vazio", () => {
    expect(boardSummaryText({ listCount: 0, cardCount: 0, overdueCount: 0 })).toBe(
      "0 listas · 0 cards",
    );
  });

  it("subtítulo com papel de administrador", () => {
    const boards = [{ role: "admin" }, { role: "admin" }, { role: "admin" }, { role: "member" }] as const;
    expect(boardsSubtitle([...boards])).toBe("4 quadros · você é administrador em 3");
  });

  it("subtítulo sem administração, com singular", () => {
    expect(boardsSubtitle([{ role: "viewer" }])).toBe("1 quadro");
  });

  it("contagem de cards do quadro", () => {
    expect(cardsInBoardText(11)).toBe("11 cards no quadro");
    expect(cardsInBoardText(1)).toBe("1 card no quadro");
  });
});
