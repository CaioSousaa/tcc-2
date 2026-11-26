export type BoardRole = "admin" | "member";

export type BoardColor = "navy" | "blue" | "green" | "amber" | "purple";
export type LabelColor = "red" | "blue" | "green" | "amber" | "purple" | "slate";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BoardSummary {
  id: string;
  title: string;
  description: string | null;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
  ownerId: string;
  role: BoardRole;
  isOwner: boolean;
  memberCount: number;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  userId: string;
  role: BoardRole;
  isOwner: boolean;
  joinedAt: string;
  user: User;
}

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface CardSummary {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  completed: boolean;
  labelIds: string[];
  assigneeIds: string[];
  checklist: { total: number; done: number };
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardList {
  id: string;
  title: string;
  position: number;
  cards: CardSummary[];
}

export interface BoardDetail {
  board: Board;
  role: BoardRole;
  isOwner: boolean;
  members: BoardMember[];
  labels: Label[];
  lists: BoardList[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  position: number;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  cardId: string;
  content: string;
  author: User | null;
  createdAt: string;
  editedAt: string | null;
}

export interface CardDetail extends CardSummary {
  listTitle: string;
  labels: Label[];
  assignees: User[];
  checklists: Checklist[];
  comments: Comment[];
}

export interface Invitation {
  id: string;
  boardId: string;
  email: string;
  role: BoardRole;
  user: User | null;
  invitedBy: User | null;
  board?: { id: string; title: string; color: BoardColor };
  createdAt: string;
}

export interface SearchResults {
  boards: { id: string; title: string; color: BoardColor }[];
  cards: {
    id: string;
    title: string;
    boardId: string;
    boardTitle: string;
    listTitle: string;
  }[];
}
