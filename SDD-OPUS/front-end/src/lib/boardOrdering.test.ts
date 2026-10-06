import { describe, expect, it } from "vitest";
import {
  arrayMove,
  cardMoveBetween,
  locateCard,
  moveCardToList,
  reorderCardInList,
  reorderLists,
} from "./boardOrdering";
import type { BoardList, CardSummary } from "./types";

const card = (id: string, listId: string, position: number): CardSummary => ({
  id,
  listId,
  title: id,
  position,
  dueDate: null,
  completed: false,
  labelIds: [],
  assigneeIds: [],
  checklistChecked: 0,
  checklistTotal: 0,
});

const list = (id: string, position: number, cardIds: string[]): BoardList => ({
  id,
  name: id,
  position,
  cards: cardIds.map((cardId, index) => card(cardId, id, index)),
});

const ids = (l: BoardList) => l.cards.map((c) => c.id);

describe("arrayMove", () => {
  it("moves an item to a new index", () => {
    expect(arrayMove(["A", "B", "C"], 2, 0)).toEqual(["C", "A", "B"]);
    expect(arrayMove(["X", "Y", "Z"], 0, 2)).toEqual(["Y", "Z", "X"]);
  });

  it("ignores an invalid origin and does not mutate", () => {
    const original = ["A", "B"];
    expect(arrayMove(original, 5, 0)).toEqual(["A", "B"]);
    arrayMove(original, 0, 1);
    expect(original).toEqual(["A", "B"]);
  });
});

describe("reorderLists (CA-L4)", () => {
  it("moves C to the first position: [A,B,C] → [C,A,B], renumbering positions", () => {
    const result = reorderLists([list("A", 0, []), list("B", 1, []), list("C", 2, [])], "C", "A");
    expect(result.map((l) => l.id)).toEqual(["C", "A", "B"]);
    expect(result.map((l) => l.position)).toEqual([0, 1, 2]);
  });

  it("is a no-op when dropped on itself", () => {
    const lists = [list("A", 0, []), list("B", 1, [])];
    expect(reorderLists(lists, "A", "A").map((l) => l.id)).toEqual(["A", "B"]);
  });
});

describe("reorderCardInList (CA-K5)", () => {
  it("moves Z to the first position: [X,Y,Z] → [Z,X,Y]", () => {
    const result = reorderCardInList([list("L", 0, ["X", "Y", "Z"])], "L", "Z", "X");
    expect(ids(result[0])).toEqual(["Z", "X", "Y"]);
    expect(result[0].cards.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it("leaves other lists untouched", () => {
    const other = list("M", 1, ["P"]);
    const result = reorderCardInList([list("L", 0, ["X", "Y"]), other], "L", "Y", "X");
    expect(result[1]).toBe(other);
  });
});

describe("moveCardToList (CA-K4, CA-K6)", () => {
  const lists = [list("A", 0, ["X", "Y"]), list("B", 1, ["P", "Q"]), list("C", 2, [])];

  it("moves X between P and Q, keeping everything else in order (CA-K4)", () => {
    const result = moveCardToList(lists, "X", "B", "Q");
    expect(ids(result[0])).toEqual(["Y"]);
    expect(ids(result[1])).toEqual(["P", "X", "Q"]);
  });

  it("renumbers positions and updates the card's list in both lists", () => {
    const result = moveCardToList(lists, "X", "B", "Q");
    expect(result[0].cards.map((c) => c.position)).toEqual([0]);
    expect(result[1].cards.map((c) => c.position)).toEqual([0, 1, 2]);
    expect(result[1].cards.every((c) => c.listId === "B")).toBe(true);
  });

  it("inserts after the hovered card when asked (dragging below it)", () => {
    expect(ids(moveCardToList(lists, "X", "B", "P", true)[1])).toEqual(["P", "X", "Q"]);
    expect(ids(moveCardToList(lists, "X", "B", "Q", true)[1])).toEqual(["P", "Q", "X"]);
  });

  it("moves into an empty list (CA-K6)", () => {
    const result = moveCardToList(lists, "X", "C", null);
    expect(ids(result[2])).toEqual(["X"]);
    expect(ids(result[0])).toEqual(["Y"]);
  });

  it("appends when no card is hovered", () => {
    expect(ids(moveCardToList(lists, "Y", "B", null)[1])).toEqual(["P", "Q", "Y"]);
  });

  it("never duplicates or loses a card", () => {
    const result = moveCardToList(lists, "X", "B", "P");
    const all = result.flatMap(ids).sort();
    expect(all).toEqual(["P", "Q", "X", "Y"]);
  });

  it("does not mutate the input", () => {
    moveCardToList(lists, "X", "B", "Q");
    expect(ids(lists[0])).toEqual(["X", "Y"]);
    expect(ids(lists[1])).toEqual(["P", "Q"]);
  });

  it("ignores unknown cards or lists", () => {
    expect(moveCardToList(lists, "nope", "B", null).map(ids)).toEqual(lists.map(ids));
    expect(moveCardToList(lists, "X", "nope", null).map(ids)).toEqual(lists.map(ids));
  });

  it("uses full-list indexes, so a hidden (filtered) card keeps its place", () => {
    // Q is hidden by a filter in the UI but still present in the data.
    const result = moveCardToList(lists, "X", "B", "Q");
    expect(ids(result[1])).toEqual(["P", "X", "Q"]);
  });
});

describe("locateCard / cardMoveBetween", () => {
  const before = [list("A", 0, ["X", "Y"]), list("B", 1, ["P"])];

  it("finds where a card is", () => {
    expect(locateCard(before, "Y")).toEqual({ listId: "A", position: 1 });
    expect(locateCard(before, "P")).toEqual({ listId: "B", position: 0 });
    expect(locateCard(before, "nope")).toBeNull();
  });

  it("reports the new list and position after a move", () => {
    const after = moveCardToList(before, "X", "B", "P", true);
    expect(cardMoveBetween(before, after, "X")).toEqual({ listId: "B", position: 1 });
  });

  it("reports null when the card ended where it started (B18)", () => {
    expect(cardMoveBetween(before, before, "X")).toBeNull();
    const dropped = reorderCardInList(before, "A", "X", "X");
    expect(cardMoveBetween(before, dropped, "X")).toBeNull();
  });

  it("reports a same-list reorder", () => {
    const after = reorderCardInList(before, "A", "Y", "X");
    expect(cardMoveBetween(before, after, "Y")).toEqual({ listId: "A", position: 0 });
  });
});
