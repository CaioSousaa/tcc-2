import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors";
import { parse } from "../../shared/http/validate";
import { inviteMemberSchema, updateMemberRoleSchema } from "./members.schemas";

function fieldsOf(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    return (error as AppError).fields ?? {};
  }
  throw new Error("expected a validation error");
}

describe("inviteMemberSchema (CA-M1, CA-M2, B3, B38)", () => {
  it("accepts an e-mail and one of the three roles", () => {
    for (const role of ["admin", "collaborator", "observer"]) {
      expect(parse(inviteMemberSchema, { email: "bia@ex.com", role })).toEqual({ email: "bia@ex.com", role });
    }
  });

  it("matches accounts regardless of e-mail case (RN-A1)", () => {
    expect(parse(inviteMemberSchema, { email: " BIA@Ex.com ", role: "observer" }).email).toBe("bia@ex.com");
  });

  it("rejects an invalid e-mail or role", () => {
    expect(fieldsOf(() => parse(inviteMemberSchema, { email: "bia", role: "observer" }))).toHaveProperty("email");
    expect(fieldsOf(() => parse(inviteMemberSchema, { email: "bia@ex.com", role: "member" }))).toHaveProperty("role");
    expect(fieldsOf(() => parse(inviteMemberSchema, { email: "bia@ex.com" }))).toHaveProperty("role");
  });
});

describe("updateMemberRoleSchema (CA-M4, CA-M6)", () => {
  it("accepts valid roles only", () => {
    expect(parse(updateMemberRoleSchema, { role: "observer" })).toEqual({ role: "observer" });
    expect(fieldsOf(() => parse(updateMemberRoleSchema, { role: "owner" }))).toHaveProperty("role");
    expect(fieldsOf(() => parse(updateMemberRoleSchema, {}))).toHaveProperty("role");
  });
});
