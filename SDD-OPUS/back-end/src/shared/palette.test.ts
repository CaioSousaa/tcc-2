import { describe, expect, it } from "vitest";
import { LABEL_COLORS, isLabelColor } from "./palette";

describe("label palette (spec E1, CA-E3)", () => {
  it("has at least 8 colors", () => {
    expect(LABEL_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it("accepts palette keys and rejects anything else", () => {
    expect(isLabelColor("red")).toBe(true);
    expect(isLabelColor("#ff0000")).toBe(false);
    expect(isLabelColor("RED")).toBe(false);
    expect(isLabelColor(undefined)).toBe(false);
    expect(isLabelColor(42)).toBe(false);
  });
});
