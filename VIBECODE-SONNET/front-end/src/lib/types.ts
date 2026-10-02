export type BoardRole = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  cardCount?: number;
}

export interface ChecklistProgress {
  done: number;
  total: number;
  percent: number;
}

export interface CardSummary {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
  boardId: string;
  dueDate: string | null;
  completed: boolean;
  labels: Label[];
  assignees: User[];
  checklistProgress: ChecklistProgress;
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

export interface BoardMemberInfo extends User {
  role: BoardRole;
  isOwner: boolean;
  joinedAt: string;
}

export interface BoardDetail {
  id: string;
  title: string;
  description: string | null;
  color: string;
  blockNonEmptyListDeletion: boolean;
  ownerId: string;
  role: BoardRole;
  isOwner: boolean;
  members: BoardMemberInfo[];
  labels: Label[];
  lists: BoardList[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  id: string;
  title: string;
  description: string | null;
  color: string;
  role: BoardRole;
  isOwner: boolean;
  owner: User;
  members: User[];
  memberCount: number;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
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
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  content: string;
  cardId: string;
  author: User | null;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
}

export interface CardDetail extends CardSummary {
  list: { id: string; title: string } | null;
  createdBy: User | null;
  checklists: Checklist[];
  comments: Comment[];
}

export interface Invitation {
  id: string;
  email: string;
  role: BoardRole;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  board?: { id: string; title: string; color: string };
  invitedBy?: User;
}

export interface SearchResult {
  boards: { id: string; title: string; color: string }[];
  cards: {
    id: string;
    title: string;
    boardId: string;
    boardTitle: string;
    boardColor: string;
    listTitle: string;
  }[];
}
