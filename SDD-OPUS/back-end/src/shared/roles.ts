export const ROLES = ["admin", "collaborator", "observer"] as const;

export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  observer: 0,
  collaborator: 1,
  admin: 2,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** True when `role` grants at least the permissions of `min` (spec §2). */
export function hasAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}
