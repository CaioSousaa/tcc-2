import { describe, expect, it } from "vitest";
import { progressPercent, progressText } from "./progress";

// RN-D1, CK3, CA-CK1…CA-CK7, B26–B28.
describe("progressPercent", () => {
  it("is 0% when nothing is checked (CA-CK1: 0/4)", () => {
    expect(progressPercent(0, 4)).toBe(0);
  });

  it("is 25% for 1 of 4 (CA-CK2)", () => {
    expect(progressPercent(1, 4)).toBe(25);
  });

  it("aggregates all checklists: 4 of 5 is 80% (CA-CK4)", () => {
    expect(progressPercent(1 + 3, 2 + 3)).toBe(80);
  });

  it("rounds DOWN (B28): 1/3 = 33%, 2/3 = 66%", () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(66);
  });

  it("reaches 100% only when every item is checked", () => {
    expect(progressPercent(3, 3)).toBe(100);
    expect(progressPercent(199, 200)).toBe(99);
  });

  it("returns null with no items — 'sem itens', never 0% (CA-CK6)", () => {
    expect(progressPercent(0, 0)).toBeNull();
  });

  it("goes back to 0% when the only checked item is unchecked or removed (B27)", () => {
    expect(progressPercent(0, 3)).toBe(0);
  });

  it("matches the CA-CK5 numbers after deleting a checked item: 1/3 = 33%", () => {
    expect(progressPercent(1, 3)).toBe(33);
  });
});

describe("progressText", () => {
  it("shows X/Y, or 'sem itens' when there are none (CA-CK6)", () => {
    expect(progressText(1, 4)).toBe("1/4");
    expect(progressText(0, 0)).toBe("sem itens");
    expect(progressText(5, 5)).toBe("5/5");
  });
});
