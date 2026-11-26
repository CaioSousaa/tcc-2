import { describe, expect, it } from "vitest";
import { assigneeMembers, toggleAssignee } from "./assignees";
import type { Member } from "./types";

const members: Member[] = [
  { userId: "u1", name: "Ana", email: null, role: "admin" },
  { userId: "u2", name: "Bia", email: null, role: "member" },
  { userId: "u3", name: "Caio", email: null, role: "viewer" },
];

describe("responsáveis do card (CA-54, CA-56, RN-23, RN-25)", () => {
  it("atribuir adiciona o membro ao card (CA-54)", () => {
    expect(toggleAssignee([], "u2")).toEqual(["u2"]);
  });

  it("remover um de dois deixa apenas o outro (CA-56)", () => {
    expect(toggleAssignee(["u1", "u2"], "u1")).toEqual(["u2"]);
  });

  it("um card pode ter vários responsáveis", () => {
    expect(toggleAssignee(["u1"], "u2")).toEqual(["u1", "u2"]);
  });

  it("não duplica ao atribuir de novo (alterna para remover)", () => {
    const once = toggleAssignee([], "u1");
    expect(toggleAssignee(once, "u1")).toEqual([]);
  });

  it("Observador também pode ser responsável (RN-25)", () => {
    expect(assigneeMembers(members, ["u3"]).map((m) => m.name)).toEqual(["Caio"]);
  });

  it("quem saiu do quadro deixa de aparecer como responsável (CA-50, RN-24)", () => {
    const afterRemoval = members.filter((m) => m.userId !== "u2");
    expect(assigneeMembers(afterRemoval, ["u1", "u2"]).map((m) => m.name)).toEqual(["Ana"]);
  });
});
