export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lists?: List[];
  labels?: Label[];
  members?: BoardMember[];
}

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards?: Card[];
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  checklists?: Checklist[];
  cardLabels?: CardLabel[];
  assignees?: CardMember[];
}

export interface Comment {
  id: string;
  content: string;
  cardId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Checklist {
  id: string;
  title: string;
  cardId: string;
  createdAt: string;
  updatedAt: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  checklistId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardLabel {
  id: string;
  cardId: string;
  labelId: string;
  label?: Label;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: "admin" | "member" | "viewer";
  joinedAt: string;
  user?: User;
}

export interface CardMember {
  id: string;
  cardId: string;
  userId: string;
  assignedAt: string;
  user?: User;
}
