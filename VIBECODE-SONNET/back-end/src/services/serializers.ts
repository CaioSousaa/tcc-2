import type { User } from "../entities/User";
import type { Card } from "../entities/Card";
import type { Label } from "../entities/Label";
import type { Comment } from "../entities/Comment";
import type { Checklist } from "../entities/Checklist";

export function serializeUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

export function serializeLabel(label: Label) {
  return { id: label.id, name: label.name, color: label.color };
}

export function serializeChecklist(checklist: Checklist) {
  const items = [...(checklist.items ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  return {
    id: checklist.id,
    title: checklist.title,
    position: checklist.position,
    items: items.map((item) => ({
      id: item.id,
      content: item.content,
      done: item.done,
      position: item.position,
    })),
  };
}

export function checklistProgress(checklists: Checklist[] | undefined) {
  let total = 0;
  let done = 0;
  for (const checklist of checklists ?? []) {
    for (const item of checklist.items ?? []) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function serializeComment(comment: Comment) {
  return {
    id: comment.id,
    content: comment.content,
    cardId: comment.cardId,
    author: comment.author ? serializeUser(comment.author) : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    edited: comment.updatedAt.getTime() - comment.createdAt.getTime() > 1000,
  };
}

export function serializeCardSummary(card: Card, commentCount = 0) {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    position: card.position,
    listId: card.listId,
    boardId: card.boardId,
    dueDate: card.dueDate,
    completed: card.completed,
    labels: (card.labels ?? []).map(serializeLabel),
    assignees: (card.assignees ?? []).map(serializeUser),
    checklistProgress: checklistProgress(card.checklists),
    commentCount,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export function serializeCardDetail(card: Card) {
  const checklists = [...(card.checklists ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const comments = [...(card.comments ?? [])].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  return {
    ...serializeCardSummary(card, comments.length),
    list: card.list ? { id: card.list.id, title: card.list.title } : null,
    createdBy: card.createdBy ? serializeUser(card.createdBy) : null,
    checklists: checklists.map(serializeChecklist),
    comments: comments.map(serializeComment),
  };
}
