import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  applyFilters,
  countCards,
  isFilterActive,
  pruneFilters,
  sortByDueDate,
  toggleLabelFilter,
} from "./filters";
import type { CardSummary, ListWithCards } from "./types";

const TODAY = "2026-10-02";

function card(
  id: string,
  labelIds: string[],
  extra: Partial<CardSummary> = {},
): CardSummary {
  return {
    id,
    listId: "L1",
    title: id,
    position: 0,
    completed: false,
    dueDate: null,
    labelIds,
    assigneeIds: [],
    progress: { done: 0, total: 0 },
    commentCount: 0,
    hasDescription: false,
    ...extra,
  };
}

const lists: ListWithCards[] = [
  {
    id: "L1",
    name: "A fazer",
    position: 0,
    cards: [
      card("x", ["X"]),
      card("y", ["Y"]),
      card("xy", ["X", "Y"]),
      card("none", []),
    ],
  },
  { id: "L2", name: "Feito", position: 1, cards: [card("only-y", ["Y"], { listId: "L2" })] },
];

const ids = (result: ListWithCards[]) => result.flatMap((list) => list.cards.map((c) => c.id));

describe("filtro por etiquetas, OU (CA-64, RN-27)", () => {
  it("por X: cards {X} e {X,Y}", () => {
    const result = applyFilters(lists, { ...EMPTY_FILTERS, labelIds: ["X"] }, TODAY);
    expect(ids(result)).toEqual(["x", "xy"]);
  });

  it("por X e Y: {X}, {Y}, {X,Y}, sem os sem etiqueta", () => {
    const result = applyFilters(lists, { ...EMPTY_FILTERS, labelIds: ["X", "Y"] }, TODAY);
    expect(ids(result)).toEqual(["x", "y", "xy", "only-y"]);
  });

  it("filtro limpo mostra todos os cards", () => {
    expect(ids(applyFilters(lists, EMPTY_FILTERS, TODAY))).toEqual([
      "x",
      "y",
      "xy",
      "none",
      "only-y",
    ]);
    expect(isFilterActive(EMPTY_FILTERS)).toBe(false);
  });

  it("mantém todas as listas, mesmo sem cards visíveis (CA-65)", () => {
    const result = applyFilters(lists, { ...EMPTY_FILTERS, labelIds: ["X"] }, TODAY);
    expect(result.map((l) => l.id)).toEqual(["L1", "L2"]);
    expect(result[1].cards).toEqual([]);
  });

  it("resultado vazio é um estado válido, contável (CA-66)", () => {
    const result = applyFilters(lists, { ...EMPTY_FILTERS, labelIds: ["Z"] }, TODAY);
    expect(countCards(result)).toBe(0);
    expect(isFilterActive({ ...EMPTY_FILTERS, labelIds: ["Z"] })).toBe(true);
  });

  it("não altera os dados de origem (CA-67, RN-28)", () => {
    applyFilters(lists, { ...EMPTY_FILTERS, labelIds: ["X"] }, TODAY);
    expect(countCards(lists)).toBe(5);
  });

  it("alternar etiqueta adiciona e remove da seleção", () => {
    const on = toggleLabelFilter(EMPTY_FILTERS, "X");
    expect(on.labelIds).toEqual(["X"]);
    expect(toggleLabelFilter(on, "X").labelIds).toEqual([]);
  });
});

describe("filtro de atrasados e combinação (CA-81, RN-27)", () => {
  const board: ListWithCards[] = [
    {
      id: "L1",
      name: "L",
      position: 0,
      cards: [
        card("late-x", ["X"], { dueDate: "2026-09-01" }),
        card("late", [], { dueDate: "2026-09-01" }),
        card("ontime-x", ["X"], { dueDate: "2026-12-01" }),
        card("done-late-x", ["X"], { dueDate: "2026-09-01", completed: true }),
        card("nodate-x", ["X"]),
      ],
    },
  ];

  it("só atrasados", () => {
    const result = applyFilters(board, { labelIds: [], overdueOnly: true }, TODAY);
    expect(ids(result)).toEqual(["late-x", "late"]);
  });

  it("atrasados E etiqueta X: apenas quem atende aos dois", () => {
    const result = applyFilters(board, { labelIds: ["X"], overdueOnly: true }, TODAY);
    expect(ids(result)).toEqual(["late-x"]);
  });

  it("mudando o 'hoje', cards entram no filtro de atrasados (CA-80)", () => {
    const filters = { labelIds: [], overdueOnly: true };
    expect(ids(applyFilters(board, filters, "2026-12-01"))).toEqual(["late-x", "late"]);
    expect(ids(applyFilters(board, filters, "2026-12-02"))).toEqual(["late-x", "late", "ontime-x"]);
  });
});

describe("etiqueta excluída com filtro ativo (CB-33)", () => {
  it("descarta etiquetas inexistentes; se era a única, o filtro volta a limpo", () => {
    const pruned = pruneFilters({ labelIds: ["gone"], overdueOnly: false }, ["X", "Y"]);
    expect(pruned.labelIds).toEqual([]);
    expect(isFilterActive(pruned)).toBe(false);
  });

  it("mantém as etiquetas que ainda existem", () => {
    const pruned = pruneFilters({ labelIds: ["X", "gone"], overdueOnly: true }, ["X"]);
    expect(pruned).toEqual({ labelIds: ["X"], overdueOnly: true });
  });
});

describe("ordenar por prazo (visualização)", () => {
  const board: ListWithCards[] = [
    {
      id: "L1",
      name: "L",
      position: 0,
      cards: [
        card("sem", [], { position: 0 }),
        card("tarde", [], { position: 1, dueDate: "2026-12-01" }),
        card("cedo", [], { position: 2, dueDate: "2026-09-01" }),
        card("cedo2", [], { position: 3, dueDate: "2026-09-01" }),
      ],
    },
  ];

  it("do prazo mais próximo ao mais distante, sem prazo por último", () => {
    expect(ids(sortByDueDate(board))).toEqual(["cedo", "cedo2", "tarde", "sem"]);
  });

  it("empate mantém a ordem original da lista", () => {
    expect(ids(sortByDueDate(board)).slice(0, 2)).toEqual(["cedo", "cedo2"]);
  });

  it("não altera a ordem real dos dados", () => {
    sortByDueDate(board);
    expect(ids(board)).toEqual(["sem", "tarde", "cedo", "cedo2"]);
  });
});
