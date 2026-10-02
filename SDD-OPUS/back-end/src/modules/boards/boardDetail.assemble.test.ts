import { describe, expect, it } from "vitest";
import {
  assembleBoardDetail,
  type CardRow,
  type ListRow,
} from "./boardDetail.assemble";

const board = { id: "b1", name: "Sprint 1", description: null, role: "collaborator" as const };

const card = (id: string, listId: string, position: number, extra: Partial<CardRow> = {}): CardRow => ({
  id,
  listId,
  title: `Card ${id}`,
  position,
  dueDate: null,
  completed: false,
  ...extra,
});

const base = {
  board,
  members: [],
  labels: [],
  lists: [] as ListRow[],
  cards: [] as CardRow[],
  progress: [],
  cardLabels: [],
  cardAssignees: [],
};

describe("assembleBoardDetail (Q3, K6, CK4, E3, M4)", () => {
  it("returns an empty board (B21)", () => {
    expect(assembleBoardDetail(base)).toEqual({
      id: "b1",
      name: "Sprint 1",
      description: null,
      role: "collaborator",
      members: [],
      labels: [],
      lists: [],
    });
  });

  it("orders lists and the cards inside each list by position (RN-S3, CA-L4, CA-K5)", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [
        { id: "L2", name: "Fazendo", position: 1 },
        { id: "L1", name: "A fazer", position: 0 },
        { id: "L3", name: "Feito", position: 2 },
      ],
      cards: [card("c3", "L1", 2), card("c1", "L1", 0), card("c2", "L1", 1), card("c4", "L2", 0)],
    });

    expect(detail.lists.map((list) => list.id)).toEqual(["L1", "L2", "L3"]);
    expect(detail.lists[0].cards.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(detail.lists[1].cards.map((c) => c.id)).toEqual(["c4"]);
    expect(detail.lists[2].cards).toEqual([]); // list without cards is valid (B21)
  });

  it("gives cards without checklist items 0/0, i.e. 'sem itens' (CA-CK6)", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [{ id: "L1", name: "A", position: 0 }],
      cards: [card("c1", "L1", 0)],
    });
    expect(detail.lists[0].cards[0]).toMatchObject({ checklistChecked: 0, checklistTotal: 0 });
  });

  it("carries the checklist progress counts of each card (CA-CK4: 4 of 5)", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [{ id: "L1", name: "A", position: 0 }],
      cards: [card("c1", "L1", 0), card("c2", "L1", 1)],
      progress: [{ cardId: "c1", checked: 4, total: 5 }],
    });
    expect(detail.lists[0].cards[0]).toMatchObject({ checklistChecked: 4, checklistTotal: 5 });
    expect(detail.lists[0].cards[1]).toMatchObject({ checklistChecked: 0, checklistTotal: 0 });
  });

  it("attaches label ids and assignee ids to the right cards", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [{ id: "L1", name: "A", position: 0 }],
      cards: [card("c1", "L1", 0), card("c2", "L1", 1), card("c3", "L1", 2)],
      cardLabels: [
        { cardId: "c1", labelId: "urgente" },
        { cardId: "c1", labelId: "bug" },
        { cardId: "c2", labelId: "bug" },
      ],
      cardAssignees: [
        { cardId: "c1", userId: "bia" },
        { cardId: "c1", userId: "caio" },
      ],
    });
    const [c1, c2, c3] = detail.lists[0].cards;
    expect(c1.labelIds).toEqual(["urgente", "bug"]);
    expect(c1.assigneeIds).toEqual(["bia", "caio"]);
    expect(c2.labelIds).toEqual(["bug"]);
    expect(c2.assigneeIds).toEqual([]);
    expect(c3.labelIds).toEqual([]);
  });

  it("passes due date and completion through unchanged (P2 is computed by the client)", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [{ id: "L1", name: "A", position: 0 }],
      cards: [card("c1", "L1", 0, { dueDate: "2026-06-09", completed: true })],
    });
    expect(detail.lists[0].cards[0]).toMatchObject({ dueDate: "2026-06-09", completed: true });
    expect(detail.lists[0].cards[0]).not.toHaveProperty("isOverdue");
  });

  it("never leaks a card into a list it does not belong to", () => {
    const detail = assembleBoardDetail({
      ...base,
      lists: [
        { id: "L1", name: "A", position: 0 },
        { id: "L2", name: "B", position: 1 },
      ],
      cards: [card("c1", "L2", 0)],
    });
    expect(detail.lists[0].cards).toEqual([]);
    expect(detail.lists[1].cards.map((c) => c.id)).toEqual(["c1"]);
  });

  it("exposes the caller's role, members and labels", () => {
    const detail = assembleBoardDetail({
      ...base,
      members: [{ userId: "u1", name: "Ana", email: "ana@ex.com", role: "admin" }],
      labels: [{ id: "l1", name: "Urgente", color: "red" }],
    });
    expect(detail.role).toBe("collaborator");
    expect(detail.members).toHaveLength(1);
    expect(detail.labels).toEqual([{ id: "l1", name: "Urgente", color: "red" }]);
  });

  it("does not mutate its inputs", () => {
    const lists: ListRow[] = [
      { id: "L2", name: "B", position: 1 },
      { id: "L1", name: "A", position: 0 },
    ];
    assembleBoardDetail({ ...base, lists });
    expect(lists.map((list) => list.id)).toEqual(["L2", "L1"]);
  });
});
