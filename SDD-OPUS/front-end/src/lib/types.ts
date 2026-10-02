// API contracts — docs/plan.md §4.5.

export type Role = "admin" | "collaborator" | "observer";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  collaborator: "Colaborador",
  observer: "Observador",
};

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  memberCount: number;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface CardSummary {
  id: string;
  listId: string;
  title: string;
  position: number;
  /** YYYY-MM-DD, no time. */
  dueDate: string | null;
  completed: boolean;
  labelIds: string[];
  assigneeIds: string[];
  checklistChecked: number;
  checklistTotal: number;
}

export interface BoardList {
  id: string;
  name: string;
  position: number;
  cards: CardSummary[];
}

export interface BoardDetail {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  members: Member[];
  labels: Label[];
  lists: BoardList[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface CardDetail extends CardSummary {
  boardId: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  checklists: Checklist[];
}

export interface Comment {
  id: string;
  cardId: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface Progress {
  checked: number;
  total: number;
}
