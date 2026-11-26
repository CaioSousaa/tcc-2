import { describe, expect, it } from "vitest";
import { decideListDeletion } from "./lists.rules";

// RF05, CA-L5, CA-L6, CA-L7, RN-X2, B23, B24.
describe("decideListDeletion", () => {
  it("deletes an empty list directly (CA-L5)", () => {
    expect(decideListDeletion(0, 0)).toEqual({ ok: true });
  });

  it("refuses to delete a list with cards when nothing was confirmed", () => {
    expect(decideListDeletion(3, 0)).toEqual({ ok: false, cardCount: 3 });
  });

  it("deletes a list whose confirmed card count matches the real one (CA-L6)", () => {
    expect(decideListDeletion(3, 3)).toEqual({ ok: true });
  });

  it("refuses when a card was added after the user confirmed (stale confirmation)", () => {
    expect(decideListDeletion(4, 3)).toEqual({ ok: false, cardCount: 4 });
  });

  it("refuses when cards were removed after the user confirmed", () => {
    expect(decideListDeletion(2, 3)).toEqual({ ok: false, cardCount: 2 });
  });

  it("reports the CURRENT count so the user can re-confirm the right number", () => {
    const decision = decideListDeletion(7, 1);
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.cardCount).toBe(7);
  });

  it("never deletes an empty list on a non-zero confirmation", () => {
    expect(decideListDeletion(0, 2)).toEqual({ ok: false, cardCount: 0 });
  });
});
