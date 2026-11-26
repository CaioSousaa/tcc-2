import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTER,
  cardMatchesFilter,
  isFilterActive,
  pruneFilter,
  toggleLabel,
  type CardFilter,
} from "./filters";

const TODAY = "2026-06-10";
const card = (labelIds: string[], extra: { dueDate?: string | null; completed?: boolean } = {}) => ({
  labelIds,
  dueDate: extra.dueDate ?? null,
  completed: extra.completed ?? false,
});
const filterOf = (ids: string[], overdueOnly = false): CardFilter => ({
  labelIds: new Set(ids),
  overdueOnly,
});

describe("label filter is a union (RN-F2, CA-E8, CA-E9, CA-E11)", () => {
  // P has only Urgente, Q only Bug, R both, S none.
  const P = card(["urgente"]);
  const Q = card(["bug"]);
  const R = card(["urgente", "bug"]);
  const S = card([]);

  it("shows every card when nothing is selected (CA-E11)", () => {
    for (const c of [P, Q, R, S]) expect(cardMatchesFilter(c, EMPTY_FILTER, TODAY)).toBe(true);
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });

  it("with one label, shows only cards that carry it (CA-E8)", () => {
    const filter = filterOf(["urgente"]);
    expect([P, Q, R, S].map((c) => cardMatchesFilter(c, filter, TODAY))).toEqual([true, false, true, false]);
  });

  it("with several labels, shows cards that have at least one of them (CA-E9)", () => {
    const filter = filterOf(["urgente", "bug"]);
    expect([P, Q, R, S].map((c) => cardMatchesFilter(c, filter, TODAY))).toEqual([true, true, true, false]);
  });

  it("hides cards without labels while a label filter is active", () => {
    expect(cardMatchesFilter(S, filterOf(["urgente"]), TODAY)).toBe(false);
  });
});

describe("toggling labels", () => {
  it("adds and removes a label without mutating the previous filter", () => {
    const first = toggleLabel(EMPTY_FILTER, "bug");
    expect([...first.labelIds]).toEqual(["bug"]);
    expect(EMPTY_FILTER.labelIds.size).toBe(0);
    const second = toggleLabel(first, "bug");
    expect(second.labelIds.size).toBe(0);
    expect(isFilterActive(second)).toBe(false);
  });
});

describe("overdue filter (P4: see which cards are late)", () => {
  it("shows only overdue open cards", () => {
    const late = card([], { dueDate: "2026-06-09" });
    const today = card([], { dueDate: "2026-06-10" });
    const done = card([], { dueDate: "2026-06-01", completed: true });
    const none = card([]);
    const filter = filterOf([], true);
    expect([late, today, done, none].map((c) => cardMatchesFilter(c, filter, TODAY))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(isFilterActive(filter)).toBe(true);
  });

  it("combines with the label filter (both must hold)", () => {
    const lateUrgent = card(["urgente"], { dueDate: "2026-06-09" });
    const lateOther = card(["bug"], { dueDate: "2026-06-09" });
    const onTimeUrgent = card(["urgente"], { dueDate: "2026-06-30" });
    const filter = filterOf(["urgente"], true);
    expect(cardMatchesFilter(lateUrgent, filter, TODAY)).toBe(true);
    expect(cardMatchesFilter(lateOther, filter, TODAY)).toBe(false);
    expect(cardMatchesFilter(onTimeUrgent, filter, TODAY)).toBe(false);
  });
});

describe("pruneFilter (B30)", () => {
  it("drops labels that no longer exist and deactivates the filter when none are left", () => {
    const pruned = pruneFilter(filterOf(["a", "b"]), new Set(["a"]));
    expect([...pruned.labelIds]).toEqual(["a"]);

    const empty = pruneFilter(filterOf(["a"]), new Set<string>());
    expect(empty.labelIds.size).toBe(0);
    expect(isFilterActive(empty)).toBe(false);
  });

  it("keeps the same object when nothing changed", () => {
    const filter = filterOf(["a"]);
    expect(pruneFilter(filter, new Set(["a", "b"]))).toBe(filter);
  });

  it("keeps the overdue switch untouched", () => {
    expect(pruneFilter(filterOf(["gone"], true), new Set<string>()).overdueOnly).toBe(true);
  });
});
