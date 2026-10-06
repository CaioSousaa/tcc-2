import type { Action, Role } from "../../shared/policy";

export type RuleResult = "ok" | "last_admin";

/**
 * O quadro precisa ter sempre ao menos um Administrador (RN-06, CA-51).
 * Rebaixar o único administrador é recusado; com outro administrador, é aceito (CB-30).
 */
export function checkRoleChange(currentRole: Role, newRole: Role, adminCount: number): RuleResult {
  if (currentRole === "admin" && newRole !== "admin" && adminCount <= 1) return "last_admin";
  return "ok";
}

/** Remover ou sair: vale para o único administrador também (CA-51, CB-31). */
export function checkRemoval(currentRole: Role, adminCount: number): RuleResult {
  if (currentRole === "admin" && adminCount <= 1) return "last_admin";
  return "ok";
}

/** Sair do quadro exige só ser membro; remover outra pessoa exige ser Administrador (RF-26, RF-28). */
export function removalAction(actorId: string, targetId: string): Action {
  return actorId === targetId ? "board.leave" : "members.manage";
}
