import type { Role } from "../../shared/roles";

/**
 * RN-B4: a board always keeps at least one Administrator. True when changing a member from
 * `currentRole` to `newRole` (null = removal) would leave the board without any Administrator.
 */
export function wouldLeaveNoAdmin(
  currentRole: Role,
  newRole: Role | null,
  adminCount: number,
): boolean {
  if (currentRole !== "admin") return false;
  if (newRole === "admin") return false;
  return adminCount <= 1;
}
