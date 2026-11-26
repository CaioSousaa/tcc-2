import { describe, expect, it } from "vitest";
import { hasAtLeast, isRole, ROLES } from "./roles";

describe("roles (spec §2)", () => {
  it("knows exactly three roles", () => {
    expect([...ROLES]).toEqual(["admin", "collaborator", "observer"]);
    expect(isRole("admin")).toBe(true);
    expect(isRole("member")).toBe(false);
  });

  it("admin satisfies every minimum role", () => {
    expect(hasAtLeast("admin", "admin")).toBe(true);
    expect(hasAtLeast("admin", "collaborator")).toBe(true);
    expect(hasAtLeast("admin", "observer")).toBe(true);
  });

  it("collaborator can edit content but not manage the board", () => {
    expect(hasAtLeast("collaborator", "collaborator")).toBe(true);
    expect(hasAtLeast("collaborator", "observer")).toBe(true);
    expect(hasAtLeast("collaborator", "admin")).toBe(false);
  });

  it("observer is read-only (CA-L8, CA-K10, CA-CM5)", () => {
    expect(hasAtLeast("observer", "observer")).toBe(true);
    expect(hasAtLeast("observer", "collaborator")).toBe(false);
    expect(hasAtLeast("observer", "admin")).toBe(false);
  });
});
