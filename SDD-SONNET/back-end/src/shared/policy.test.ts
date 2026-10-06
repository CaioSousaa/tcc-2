import { describe, expect, it } from "vitest";
import { POLICY, can, decideAccess, type Action, type Role } from "./policy";

const ROLES: Role[] = ["admin", "member", "viewer"];

/** Matriz RN-07: [ação, admin, member, viewer]. */
const MATRIX: [Action, boolean, boolean, boolean][] = [
  ["board.view", true, true, true],
  ["members.view", true, true, true],
  ["card.view", true, true, true],
  ["board.update", true, false, false],
  ["board.delete", true, false, false],
  ["members.manage", true, false, false],
  ["board.leave", true, true, true],
  ["list.manage", true, true, false],
  ["card.manage", true, true, false],
  ["checklist.manage", true, true, false],
  ["assignee.manage", true, true, false],
  ["label.manage", true, true, false],
  ["comment.create", true, true, false],
];

describe("matriz de permissões (RN-07)", () => {
  it.each(MATRIX)("%s", (action, admin, member, viewer) => {
    expect(can("admin", action)).toBe(admin);
    expect(can("member", action)).toBe(member);
    expect(can("viewer", action)).toBe(viewer);
  });

  it("toda ação da política está coberta pela matriz do teste", () => {
    expect(MATRIX.map(([action]) => action).sort()).toEqual(
      (Object.keys(POLICY) as Action[]).sort(),
    );
  });

  it("Observador nunca altera dados (CA-27, CA-36, CA-68, CA-72)", () => {
    const writes = (Object.keys(POLICY) as Action[]).filter(
      (action) => !["board.view", "members.view", "card.view", "board.leave"].includes(action),
    );
    for (const action of writes) expect(can("viewer", action)).toBe(false);
  });

  it("só o Administrador gerencia quadro e membros (CA-17, CA-53)", () => {
    for (const action of ["board.update", "board.delete", "members.manage"] as Action[]) {
      expect(ROLES.filter((role) => can(role, action))).toEqual(["admin"]);
    }
  });
});

describe("decisão de acesso (RN-10, RT-06)", () => {
  it("não membro recebe not_found, igual a recurso inexistente (CA-13)", () => {
    expect(decideAccess(null, "board.view")).toBe("not_found");
    expect(decideAccess(null, "board.delete")).toBe("not_found");
  });

  it("membro sem permissão recebe forbidden", () => {
    expect(decideAccess("member", "board.delete")).toBe("forbidden");
    expect(decideAccess("viewer", "card.manage")).toBe("forbidden");
  });

  it("membro com permissão é allowed", () => {
    expect(decideAccess("viewer", "board.view")).toBe("allowed");
    expect(decideAccess("member", "list.manage")).toBe("allowed");
    expect(decideAccess("admin", "board.delete")).toBe("allowed");
  });
});
