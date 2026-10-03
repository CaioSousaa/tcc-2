import type { BoardMember } from "../entities/BoardMember";
import type { Card } from "../entities/Card";
import type { Checklist } from "../entities/Checklist";
import type { ChecklistItem } from "../entities/ChecklistItem";
import type { Comment } from "../entities/Comment";
import type { Label } from "../entities/Label";
import type { User } from "../entities/User";

export const serializeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

export const serializeLabel = (label: Label) => ({
  id: label.id,
  name: label.name,
  color: label.color,
});

export const serializeMember = (member: BoardMember) => ({
  id: member.id,
  role: member.role,
  user: serializeUser(member.user),
  joinedAt: member.createdAt,
});

/** Atrasado = prazo já passou e o card ainda não foi concluído. */
export function isOverdue(card: Card, now = new Date()): boolean {
  return (
    !card.completed && card.dueDate !== null && card.dueDate.getTime() < now.getTime()
  );
}

export function progressOf(items: ChecklistItem[]) {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position;

export function serializeChecklist(checklist: Checklist) {
  const items = [...(checklist.items ?? [])].sort(byPosition);
  return {
    id: checklist.id,
    title: checklist.title,
    position: checklist.position,
    progress: progressOf(items),
    items: items.map((item) => ({
      id: item.id,
      content: item.content,
      done: item.done,
      position: item.position,
    })),
  };
}

/** Versão resumida usada na visualização do quadro. */
export function serializeCardSummary(card: Card, commentCount: number) {
  const allItems = (card.checklists ?? []).flatMap((c) => c.items ?? []);
  return {
    id: card.id,
    listId: card.listId,
    title: card.title,
    description: card.description,
    position: card.position,
    dueDate: card.dueDate,
    completed: card.completed,
    overdue: isOverdue(card),
    labels: (card.labels ?? []).map(serializeLabel),
    assignees: (card.assignees ?? []).map(serializeUser),
    checklistProgress: progressOf(allItems),
    commentCount,
  };
}

/** Versão completa usada no modal de detalhes do card. */
export function serializeCardDetail(card: Card, commentCount: number) {
  return {
    ...serializeCardSummary(card, commentCount),
    listName: card.list?.name,
    checklists: [...(card.checklists ?? [])]
      .sort(byPosition)
      .map(serializeChecklist),
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export const serializeComment = (comment: Comment) => ({
  id: comment.id,
  cardId: comment.cardId,
  content: comment.content,
  author: serializeUser(comment.author),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  edited: comment.updatedAt.getTime() - comment.createdAt.getTime() > 1000,
});
