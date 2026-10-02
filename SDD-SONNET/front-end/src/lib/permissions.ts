import type { Role } from "./types";

export type Action =
  | "board.update"
  | "board.delete"
  | "members.manage"
  | "list.manage"
  | "card.manage"
  | "checklist.manage"
  | "assignee.manage"
  | "label.manage"
  | "comment.create";

const EDITORS: readonly Role[] = ["admin", "member"];
const ADMIN: readonly Role[] = ["admin"];

/** Espelho da matriz do back-end (RN-07). A API continua sendo a barreira. */
const POLICY: Record<Action, readonly Role[]> = {
  "board.update": ADMIN,
  "board.delete": ADMIN,
  "members.manage": ADMIN,
  "list.manage": EDITORS,
  "card.manage": EDITORS,
  "checklist.manage": EDITORS,
  "assignee.manage": EDITORS,
  "label.manage": EDITORS,
  "comment.create": EDITORS,
};

export function can(role: Role, action: Action): boolean {
  return POLICY[action].includes(role);
}

export const ACTIONS = Object.keys(POLICY) as Action[];
