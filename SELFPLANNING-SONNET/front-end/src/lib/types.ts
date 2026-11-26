export type Role = "ADMIN" | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export interface CardSummary {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  dueDate: string | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysDiff: number | null;
  progress: Progress | null;
  labels: Label[];
  assignees: User[];
  commentCount: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  title: string;
  position: number;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface CardDetail extends CardSummary {
  checklists: Checklist[];
  comments: Comment[];
}

export interface ListWithCards {
  id: string;
  name: string;
  position: number;
  cards: CardSummary[];
}

export interface BoardDetail {
  id: string;
  name: string;
  description: string | null;
  color: string;
  role: Role;
  lists: ListWithCards[];
  labels: Label[];
  members: Member[];
}

export interface BoardSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  role: Role;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: { userId: string; name: string }[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
