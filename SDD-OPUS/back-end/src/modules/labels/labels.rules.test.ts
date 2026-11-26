import { describe, expect, it } from "vitest";
import { labelNameKey } from "./labels.rules";

// CA-E2: "Urgente" and "urgente" are the same label name inside one board.
describe("labelNameKey", () => {
  it("is case-insensitive", () => {
    expect(labelNameKey("Urgente")).toBe(labelNameKey("urgente"));
    expect(labelNameKey("URGENTE")).toBe("urgente");
  });

  it("ignores surrounding whitespace", () => {
    expect(labelNameKey("  Bug ")).toBe("bug");
  });

  it("keeps different names different", () => {
    expect(labelNameKey("Bug")).not.toBe(labelNameKey("Bug 2"));
  });

  it("handles accents consistently", () => {
    expect(labelNameKey("Revisão")).toBe("revisão");
  });
});
