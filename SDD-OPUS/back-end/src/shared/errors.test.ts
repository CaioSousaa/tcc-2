import { describe, expect, it } from "vitest";
import { AppError, Errors, errorBody } from "./errors";

describe("error contract (plan §4.2)", () => {
  it.each([
    [Errors.validation({ name: "x" }), 400, "VALIDATION_ERROR"],
    [Errors.unauthenticated(), 401, "UNAUTHENTICATED"],
    [Errors.invalidCredentials(), 401, "INVALID_CREDENTIALS"],
    [Errors.forbidden(), 403, "FORBIDDEN"],
    [Errors.notFound(), 404, "NOT_FOUND"],
    [Errors.emailInUse(), 409, "EMAIL_IN_USE"],
    [Errors.alreadyMember(), 409, "ALREADY_MEMBER"],
    [Errors.labelNameInUse(), 409, "LABEL_NAME_IN_USE"],
    [Errors.lastAdmin(), 409, "LAST_ADMIN"],
    [Errors.listNotEmpty(3), 409, "LIST_NOT_EMPTY"],
    [Errors.userNotFound(), 422, "USER_NOT_FOUND"],
    [Errors.userNotMember(), 422, "USER_NOT_MEMBER"],
    [Errors.invalidTarget(), 422, "INVALID_TARGET"],
    [Errors.rateLimited(), 429, "RATE_LIMITED"],
    [Errors.internal(), 500, "INTERNAL_ERROR"],
  ])("maps to the documented status and stable code", (error, status, code) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
  });

  it("serializes fields only for validation errors", () => {
    expect(errorBody(Errors.validation({ email: "inválido" })).error.fields).toEqual({
      email: "inválido",
    });
    expect(errorBody(Errors.notFound()).error.fields).toBeUndefined();
  });

  it("LIST_NOT_EMPTY carries the current card count (CA-L6)", () => {
    expect(errorBody(Errors.listNotEmpty(3)).error.details).toEqual({ cardCount: 3 });
  });
});
