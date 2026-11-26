import { describe, expect, it } from "vitest";
import { countOverdue, dueStatus, formatDueDate, isOverdue, todayLocal } from "./dates";

// Spec §4.9 — "today" is 10/06 in every scenario.
const TODAY = "2026-06-10";

describe("isOverdue (P2, CA-P2…CA-P7, RN-D3)", () => {
  it("is overdue when the deadline is before today and the card is open (CA-P2)", () => {
    expect(isOverdue("2026-06-09", false, TODAY)).toBe(true);
  });

  it("is NOT overdue on the deadline day (CA-P3)", () => {
    expect(isOverdue("2026-06-10", false, TODAY)).toBe(false);
  });

  it("becomes overdue when the day turns, without any edit (CA-P4)", () => {
    expect(isOverdue("2026-06-10", false, "2026-06-11")).toBe(true);
  });

  it("is not overdue when completed, and is again when reopened (CA-P5, B33)", () => {
    expect(isOverdue("2026-06-09", true, TODAY)).toBe(false);
    expect(isOverdue("2026-06-09", false, TODAY)).toBe(true);
  });

  it("is never overdue without a deadline (CA-P6)", () => {
    expect(isOverdue(null, false, TODAY)).toBe(false);
  });

  it("stops being overdue once the deadline moves forward or is removed (CA-P7, B34)", () => {
    expect(isOverdue("2026-06-12", false, TODAY)).toBe(false);
    expect(isOverdue(null, false, TODAY)).toBe(false);
  });

  it("accepts past deadlines — such a card is immediately overdue (CA-P10, RN-D4)", () => {
    expect(isOverdue("2020-01-01", false, TODAY)).toBe(true);
  });

  it("compares across month and year boundaries correctly", () => {
    expect(isOverdue("2025-12-31", false, "2026-01-01")).toBe(true);
    expect(isOverdue("2026-02-28", false, "2026-03-01")).toBe(true);
    expect(isOverdue("2026-03-01", false, "2026-02-28")).toBe(false);
  });
});

describe("dueStatus (P3: overdue, upcoming and completed are distinguishable)", () => {
  it("classifies every case", () => {
    expect(dueStatus({ dueDate: null, completed: false }, TODAY)).toBe("none");
    expect(dueStatus({ dueDate: "2026-06-09", completed: true }, TODAY)).toBe("done");
    expect(dueStatus({ dueDate: "2026-06-09", completed: false }, TODAY)).toBe("overdue");
    expect(dueStatus({ dueDate: "2026-06-10", completed: false }, TODAY)).toBe("today");
    expect(dueStatus({ dueDate: "2026-06-15", completed: false }, TODAY)).toBe("upcoming");
  });
});

describe("countOverdue (P4, CA-P8, B33)", () => {
  it("counts only overdue, open cards", () => {
    const cards = [
      { dueDate: "2026-06-01", completed: false },
      { dueDate: "2026-06-05", completed: false },
      { dueDate: "2026-06-09", completed: false },
      { dueDate: "2026-06-02", completed: true },
      { dueDate: "2026-06-10", completed: false },
      { dueDate: "2026-06-30", completed: false },
      { dueDate: null, completed: false },
    ];
    expect(countOverdue(cards, TODAY)).toBe(3);
  });

  it("is zero for an empty board", () => {
    expect(countOverdue([], TODAY)).toBe(0);
  });
});

describe("todayLocal (RN-D3: the viewer's own day)", () => {
  it("formats the LOCAL calendar date, zero-padded", () => {
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(todayLocal(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  it("does not shift the day because of the UTC offset", () => {
    // Local 00:30 and 23:30 of the same day must give the same date.
    expect(todayLocal(new Date(2026, 5, 10, 0, 30))).toBe("2026-06-10");
    expect(todayLocal(new Date(2026, 5, 10, 23, 30))).toBe("2026-06-10");
  });
});

describe("formatDueDate", () => {
  it("writes day/month/year without parsing the date", () => {
    expect(formatDueDate("2026-06-15")).toBe("15/06/2026");
    expect(formatDueDate("2026-01-05")).toBe("05/01/2026");
  });
});
