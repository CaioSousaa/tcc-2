import { describe, expect, it } from "vitest";
import { clampPosition, insertAt, moveWithin, removeId, sameOrder } from "./ordering";

describe("clampPosition (B19)", () => {
  it("keeps valid positions", () => {
    expect(clampPosition(0, 3)).toBe(0);
    expect(clampPosition(2, 3)).toBe(2);
    expect(clampPosition(3, 3)).toBe(3);
  });

  it("adjusts out-of-range positions instead of failing", () => {
    expect(clampPosition(-5, 3)).toBe(0);
    expect(clampPosition(99, 3)).toBe(3);
  });

  it("drops fractions and sends non-finite values to the end", () => {
    expect(clampPosition(1.9, 3)).toBe(1);
    expect(clampPosition(Number.NaN, 3)).toBe(3);
    expect(clampPosition(Number.POSITIVE_INFINITY, 3)).toBe(3);
  });
});

describe("moveWithin — reordering inside one container (CA-L4, CA-K5)", () => {
  it("moves the last item to the front: [A,B,C] → [C,A,B]", () => {
    expect(moveWithin(["A", "B", "C"], "C", 0)).toEqual(["C", "A", "B"]);
  });

  it("moves an item down: [X,Y,Z] → [Y,Z,X]", () => {
    expect(moveWithin(["X", "Y", "Z"], "X", 2)).toEqual(["Y", "Z", "X"]);
  });

  it("moves an item to the middle", () => {
    expect(moveWithin(["A", "B", "C", "D"], "A", 2)).toEqual(["B", "C", "A", "D"]);
  });

  it("is a no-op when the item is already at that position (B18)", () => {
    const before = ["A", "B", "C"];
    expect(sameOrder(moveWithin(before, "B", 1), before)).toBe(true);
    expect(sameOrder(moveWithin(before, "A", 0), before)).toBe(true);
    expect(sameOrder(moveWithin(before, "C", 2), before)).toBe(true);
  });

  it("clamps the target position (B19)", () => {
    expect(moveWithin(["A", "B", "C"], "A", 100)).toEqual(["B", "C", "A"]);
    expect(moveWithin(["A", "B", "C"], "C", -1)).toEqual(["C", "A", "B"]);
  });

  it("keeps the relative order of the other items (RN-S3)", () => {
    const result = moveWithin(["A", "B", "C", "D", "E"], "D", 1);
    expect(result.filter((id) => id !== "D")).toEqual(["A", "B", "C", "E"]);
  });

  it("never duplicates or loses items", () => {
    const result = moveWithin(["A", "B", "C"], "B", 0);
    expect([...result].sort()).toEqual(["A", "B", "C"]);
  });

  it("works on a single-item container", () => {
    expect(moveWithin(["A"], "A", 5)).toEqual(["A"]);
  });
});

describe("insertAt — moving into another container (CA-K4, CA-K6)", () => {
  it("inserts between existing items: position 1 of [P,Q] → [P,X,Q]", () => {
    expect(insertAt(["P", "Q"], "X", 1)).toEqual(["P", "X", "Q"]);
  });

  it("appends into an empty container", () => {
    expect(insertAt([], "X", 0)).toEqual(["X"]);
    expect(insertAt([], "X", 7)).toEqual(["X"]);
  });

  it("clamps to the start and to the end", () => {
    expect(insertAt(["P", "Q"], "X", -3)).toEqual(["X", "P", "Q"]);
    expect(insertAt(["P", "Q"], "X", 9)).toEqual(["P", "Q", "X"]);
  });

  it("does not mutate its input", () => {
    const ids = ["P", "Q"];
    insertAt(ids, "X", 1);
    expect(ids).toEqual(["P", "Q"]);
  });
});

describe("removeId — closing the gap (CA-K8, CA-L5)", () => {
  it("removes the item keeping the order of the rest", () => {
    expect(removeId(["A", "B", "C"], "B")).toEqual(["A", "C"]);
  });

  it("ignores ids that are not present", () => {
    expect(removeId(["A"], "Z")).toEqual(["A"]);
  });
});

describe("a card moved between lists", () => {
  it("leaves the source without it and the target with it at the chosen spot", () => {
    const source = ["X", "Y"];
    const target = ["P", "Q"];
    expect(removeId(source, "X")).toEqual(["Y"]);
    expect(insertAt(target, "X", 1)).toEqual(["P", "X", "Q"]);
  });
});
