export type Role = "admin" | "member" | "viewer";

export type Action =
  | "board.view"
  | "board.update"
  | "board.delete"
  | "board.leave"
  | "members.view"
  | "members.manage"
  | "list.manage"
  | "card.view"
  | "card.manage"
  | "checklist.manage"
  | "assignee.manage"
  | "label.manage"
  | "comment.create";

const ALL: readonly Role[] = ["admin", "member", "viewer"];
const EDITORS: readonly Role[] = ["admin", "member"];
const ADMIN: readonly Role[] = ["admin"];

/** Única fonte da matriz de permissões (RN-07). */
export const POLICY: Record<Action, readonly Role[]> = {
  "board.view": ALL,
  "board.update": ADMIN,
  "board.delete": ADMIN,
  "board.leave": ALL,
  "members.view": ALL,
  "members.manage": ADMIN,
  "list.manage": EDITORS,
  "card.view": ALL,
  "card.manage": EDITORS,
  "checklist.manage": EDITORS,
  "assignee.manage": EDITORS,
  "label.manage": EDITORS,
  "comment.create": EDITORS,
};

export function can(role: Role, action: Action): boolean {
  return POLICY[action].includes(role);
}

export type AccessDecision = "allowed" | "not_found" | "forbidden";

/**
 * Quem não é membro recebe 404 (indistinguível de recurso inexistente);
 * membro sem permissão recebe 403 (RN-10, RT-06).
 */
export function decideAccess(role: Role | null, action: Action): AccessDecision {
  if (role === null) return "not_found";
  return can(role, action) ? "allowed" : "forbidden";
}
