import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  cardId: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  cardId: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  listId: string;
  labels: Label[];
  assignees: User[];
  checklists: ChecklistItem[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  boardId: string;
  cards: Card[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  members: User[];
  lists: List[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

// Board operations
export const boardService = {
  // Boards
  getBoards: () => api.get<Board[]>('/boards'),
  getBoardById: (id: string) => api.get<Board>(`/boards/${id}`),
  createBoard: (data: { title: string; description?: string }) =>
    api.post<Board>('/boards', data),
  updateBoard: (id: string, data: Partial<Board>) =>
    api.patch<Board>(`/boards/${id}`, data),
  deleteBoard: (id: string) => api.delete(`/boards/${id}`),

  // Lists
  createList: (boardId: string, data: { title: string }) =>
    api.post<List>(`/boards/${boardId}/lists`, data),
  updateList: (listId: string, data: Partial<List>) =>
    api.patch<List>(`/lists/${listId}`, data),
  deleteList: (listId: string) => api.delete(`/lists/${listId}`),
  reorderLists: (boardId: string, data: { listIds: string[] }) =>
    api.post(`/boards/${boardId}/lists/reorder`, data),

  // Cards
  createCard: (listId: string, data: { title: string; description?: string }) =>
    api.post<Card>(`/lists/${listId}/cards`, data),
  getCard: (cardId: string) => api.get<Card>(`/cards/${cardId}`),
  updateCard: (cardId: string, data: Partial<Card>) =>
    api.patch<Card>(`/cards/${cardId}`, data),
  deleteCard: (cardId: string) => api.delete(`/cards/${cardId}`),
  moveCard: (cardId: string, data: { listId: string; position: number }) =>
    api.patch<Card>(`/cards/${cardId}/move`, data),
  reorderCards: (listId: string, data: { cardIds: string[] }) =>
    api.post(`/lists/${listId}/cards/reorder`, data),

  // Labels
  createLabel: (boardId: string, data: { name: string; color: string }) =>
    api.post<Label>(`/boards/${boardId}/labels`, data),
  updateLabel: (labelId: string, data: Partial<Label>) =>
    api.patch<Label>(`/labels/${labelId}`, data),
  deleteLabel: (labelId: string) => api.delete(`/labels/${labelId}`),

  // Card Labels
  addLabelToCard: (cardId: string, labelId: string) =>
    api.post(`/cards/${cardId}/labels/${labelId}`),
  removeLabelFromCard: (cardId: string, labelId: string) =>
    api.delete(`/cards/${cardId}/labels/${labelId}`),

  // Assignees
  assignUserToCard: (cardId: string, userId: string) =>
    api.post(`/cards/${cardId}/assignees/${userId}`),
  removeAssigneeFromCard: (cardId: string, userId: string) =>
    api.delete(`/cards/${cardId}/assignees/${userId}`),

  // Checklists
  createChecklist: (cardId: string, data: { title: string }) =>
    api.post<ChecklistItem>(`/cards/${cardId}/checklists`, data),
  updateChecklistItem: (checklistId: string, data: Partial<ChecklistItem>) =>
    api.patch<ChecklistItem>(`/checklists/${checklistId}`, data),
  deleteChecklistItem: (checklistId: string) =>
    api.delete(`/checklists/${checklistId}`),

  // Comments
  createComment: (cardId: string, data: { content: string }) =>
    api.post<Comment>(`/cards/${cardId}/comments`, data),
  updateComment: (commentId: string, data: { content: string }) =>
    api.patch<Comment>(`/comments/${commentId}`, data),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),

  // Board Members
  addMemberToBoard: (boardId: string, userId: string) =>
    api.post(`/boards/${boardId}/members/${userId}`),
  removeMemberFromBoard: (boardId: string, userId: string) =>
    api.delete(`/boards/${boardId}/members/${userId}`),
  getAvailableMembers: (boardId: string) =>
    api.get<User[]>(`/boards/${boardId}/available-members`),
};
