export type Role = "admin" | "member" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  color: BoardColor;
  role: Role;
  createdAt: string;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: { userId: string; name: string }[];
}

export interface Member {
  userId: string;
  name: string;
  /** Só Administradores recebem o e-mail dos membros. */
  email: string | null;
  role: Role;
}

/** Paleta de etiquetas do protótipo (RT-30). */
export type LabelColor = "red" | "amber" | "green" | "blue" | "purple" | "slate";

/** Cores de faixa dos quadros, como no protótipo. */
export type BoardColor = "navy" | "blue" | "green" | "amber" | "purple";

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Progress {
  done: number;
  total: number;
}

export interface CardSummary {
  id: string;
  listId: string;
  title: string;
  position: number;
  completed: boolean;
  dueDate: string | null;
  labelIds: string[];
  assigneeIds: string[];
  progress: Progress;
  commentCount: number;
  hasDescription: boolean;
}

export interface ListWithCards {
  id: string;
  name: string;
  position: number;
  cards: CardSummary[];
}

export interface BoardFull {
  board: { id: string; name: string; color: BoardColor; myRole: Role; createdAt: string };
  members: Member[];
  labels: Label[];
  lists: ListWithCards[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface CardDetail extends CardSummary {
  description: string | null;
  checklists: Checklist[];
  comments: Comment[];
}
