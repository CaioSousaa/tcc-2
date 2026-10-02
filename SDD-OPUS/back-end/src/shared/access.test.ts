import { describe, expect, it, vi } from "vitest";
import { assertRole } from "./access";
import type { AppError } from "./errors";

// access.ts imports the data source and an entity; the pure decision function needs neither,
// so both are stubbed. vi.mock is hoisted above the imports.
vi.mock("../database", () => ({ AppDataSource: {} }));
vi.mock("../entities/BoardMember", () => ({ BoardMember: class {} }));

function errorOf(fn: () => unknown): AppError {
  try {
    fn();
  } catch (error) {
    return error as AppError;
  }
  throw new Error("expected an error");
}

describe("assertRole — 404 without membership, 403 with too little role (plan §4.2)", () => {
  it("is 'not found' for someone who is not a member, whatever is required (CA-Q3, B12)", () => {
    for (const min of ["observer", "collaborator", "admin"] as const) {
      const error = errorOf(() => assertRole(null, min));
      expect(error.status).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    }
  });

  it("is 'forbidden' for a member whose role is too low (CA-Q5, B13)", () => {
    expect(errorOf(() => assertRole("observer", "collaborator")).code).toBe("FORBIDDEN");
    expect(errorOf(() => assertRole("collaborator", "admin")).status).toBe(403);
    expect(errorOf(() => assertRole("observer", "admin")).status).toBe(403);
  });

  it("returns the role when it is sufficient", () => {
    expect(assertRole("admin", "admin")).toBe("admin");
    expect(assertRole("admin", "collaborator")).toBe("admin");
    expect(assertRole("collaborator", "collaborator")).toBe("collaborator");
    expect(assertRole("observer", "observer")).toBe("observer");
  });

  it("gives identical responses for 'does not exist' and 'not yours'", () => {
    const a = errorOf(() => assertRole(null, "observer"));
    expect(a.message).toBe("Recurso não encontrado.");
  });
});
