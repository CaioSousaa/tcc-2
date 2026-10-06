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
}

export interface List {
  id: string;
  boardId: string;
  name: string;
  order: number;
  cards?: Card[];
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  dueDate?: string;
  order: number;
  members?: CardMember[];
  labels?: CardLabel[];
  checklists?: Checklist[];
  comments?: Comment[];
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  author?: User;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardMember {
  id: string;
  userId: string;
  user?: User;
}

export interface CardLabel {
  id: string;
  labelId: string;
  label?: Label;
}

export type BoardRole = 'owner' | 'admin' | 'member' | 'observer';
