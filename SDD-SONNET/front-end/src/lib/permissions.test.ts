import { describe, expect, it } from "vitest";
import { ACTIONS, can, type Action } from "./permissions";

const MATRIX: [Action, boolean, boolean, boolean][] = [
  ["board.update", true, false, false],
  ["board.delete", true, false, false],
  ["members.manage", true, false, false],
  ["list.manage", true, true, false],
  ["card.manage", true, true, false],
  ["checklist.manage", true, true, false],
  ["assignee.manage", true, true, false],
  ["label.manage", true, true, false],
  ["comment.create", true, true, false],
];

describe("espelho da matriz de permissões (RN-07, RT-22)", () => {
  it.each(MATRIX)("%s", (action, admin, member, viewer) => {
    expect(can("admin", action)).toBe(admin);
    expect(can("member", action)).toBe(member);
    expect(can("viewer", action)).toBe(viewer);
  });

  it("cobre todas as ações", () => {
    expect(MATRIX.map(([action]) => action).sort()).toEqual([...ACTIONS].sort());
  });
});
