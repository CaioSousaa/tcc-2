export type BoardRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Member {
  id: string;
  role: BoardRole;
  user: User;
  joinedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  usage?: number;
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
  dueDate: string | null;
  completed: boolean;
  overdue: boolean;
  labels: Label[];
  assignees: User[];
  checklistProgress: Progress;
  commentCount: number;
}

export interface ChecklistItem {
  id: string;
  content: string;
  done: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  title: string;
  position: number;
  progress: Progress;
  items: ChecklistItem[];
}

export interface CardDetail extends CardSummary {
  listName: string;
  checklists: Checklist[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardListData {
  id: string;
  name: string;
  position: number;
  cardCount: number;
  cards: CardSummary[];
}

export interface BoardSummary {
  id: string;
  name: string;
  color: string;
  role: BoardRole;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: Member[];
  createdAt: string;
}

export interface BoardDetail {
  id: string;
  name: string;
  color: string;
  role: BoardRole;
  cardCount: number;
  visibleCardCount: number;
  labels: Label[];
  members: Member[];
  lists: BoardListData[];
}

export interface Comment {
  id: string;
  cardId: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
}
