import type { User } from "../entities/User";
import type { Card } from "../entities/Card";
import type { Checklist } from "../entities/Checklist";
import type { Comment } from "../entities/Comment";
import type { Label } from "../entities/Label";

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

export function serializeLabel(label: Label) {
  return { id: label.id, name: label.name, color: label.color };
}

export function checklistProgress(checklists: Checklist[] = []) {
  let total = 0;
  let done = 0;
  for (const checklist of checklists) {
    for (const item of checklist.items ?? []) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { total, done };
}

/** Card as shown on the board: only ids for labels/assignees plus counters. */
export function serializeCardSummary(card: Card, commentCount = 0) {
  return {
    id: card.id,
    boardId: card.boardId,
    listId: card.listId,
    title: card.title,
    description: card.description,
    position: card.position,
    dueDate: card.dueDate ? card.dueDate.toISOString() : null,
    completed: card.completed,
    labelIds: (card.labels ?? []).map((label) => label.id),
    assigneeIds: (card.assignees ?? []).map((user) => user.id),
    checklist: checklistProgress(card.checklists),
    commentCount,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

export function serializeChecklist(checklist: Checklist) {
  return {
    id: checklist.id,
    cardId: checklist.cardId,
    title: checklist.title,
    position: checklist.position,
    items: [...(checklist.items ?? [])]
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map((item) => ({
        id: item.id,
        text: item.text,
        done: item.done,
        position: item.position,
      })),
  };
}

export function serializeComment(comment: Comment) {
  return {
    id: comment.id,
    cardId: comment.cardId,
    content: comment.content,
    author: comment.author ? publicUser(comment.author) : null,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
  };
}
