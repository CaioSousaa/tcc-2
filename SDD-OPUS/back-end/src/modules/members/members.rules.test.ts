import { describe, expect, it } from "vitest";
import { wouldLeaveNoAdmin } from "./members.rules";

// RN-B4, CA-M5, CA-M6, B16.
describe("wouldLeaveNoAdmin", () => {
  it("blocks demoting or removing the only Administrator", () => {
    expect(wouldLeaveNoAdmin("admin", "collaborator", 1)).toBe(true);
    expect(wouldLeaveNoAdmin("admin", "observer", 1)).toBe(true);
    expect(wouldLeaveNoAdmin("admin", null, 1)).toBe(true);
  });

  it("allows it when another Administrator remains", () => {
    expect(wouldLeaveNoAdmin("admin", "collaborator", 2)).toBe(false);
    expect(wouldLeaveNoAdmin("admin", null, 2)).toBe(false);
    expect(wouldLeaveNoAdmin("admin", null, 5)).toBe(false);
  });

  it("never blocks changes to non-administrators", () => {
    expect(wouldLeaveNoAdmin("collaborator", null, 1)).toBe(false);
    expect(wouldLeaveNoAdmin("observer", "admin", 1)).toBe(false);
    expect(wouldLeaveNoAdmin("collaborator", "observer", 1)).toBe(false);
  });

  it("never blocks keeping or granting the admin role", () => {
    expect(wouldLeaveNoAdmin("admin", "admin", 1)).toBe(false);
  });

  it("treats a corrupted count of zero as 'no admin would remain'", () => {
    expect(wouldLeaveNoAdmin("admin", null, 0)).toBe(true);
  });
});
