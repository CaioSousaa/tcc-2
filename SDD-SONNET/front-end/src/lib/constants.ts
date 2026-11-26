import type { Role } from "./types";

/** Limites idênticos aos do back-end (`shared/validation.ts`). */
export const LIMITS = {
  userName: { min: 1, max: 80 },
  email: { max: 254 },
  password: { min: 8, max: 128 },
  boardName: { min: 1, max: 100 },
  listName: { min: 1, max: 100 },
  cardTitle: { min: 1, max: 200 },
  cardDescription: { max: 5000 },
  checklistTitle: { min: 1, max: 200 },
  checklistItem: { min: 1, max: 200 },
  labelName: { min: 1, max: 30 },
  comment: { min: 1, max: 2000 },
} as const;

export const SESSION_COOKIE = "session";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  member: "Membro",
  viewer: "Observador",
};

export const ROLE_TAGS: Record<Role, string> = {
  admin: "ADMIN",
  member: "MEMBRO",
  viewer: "OBSERVADOR",
};
