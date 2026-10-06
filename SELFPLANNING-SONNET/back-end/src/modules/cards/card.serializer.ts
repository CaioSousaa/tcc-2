import { Card } from "../../entities/Card";

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS);
}

export function parseDueDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
}

export function dueInfo(dueDate: Date | null, now = new Date()) {
  if (!dueDate) {
    return { dueDate: null, isOverdue: false, isDueSoon: false, daysDiff: null };
  }
  const dueKey = dueDate.toISOString().slice(0, 10);
  const daysDiff = dayNumber(dueKey) - dayNumber(localDateKey(now));
  return {
    dueDate: dueKey,
    isOverdue: daysDiff < 0,
    isDueSoon: daysDiff >= 0 && daysDiff <= 3,
    daysDiff,
  };
}

export function computeProgress(card: Card): Progress | null {
  let total = 0;
  let done = 0;
  for (const checklist of card.checklists ?? []) {
    for (const item of checklist.items ?? []) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  if (total === 0) return null;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export function serializeCard(card: Card, commentCount = 0) {
  return {
    id: card.id,
    listId: card.listId,
    title: card.title,
    description: card.description,
    position: card.position,
    createdAt: card.createdAt,
    ...dueInfo(card.dueDate),
    progress: computeProgress(card),
    labels: (card.labels ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
    })),
    assignees: (card.assignees ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    })),
    commentCount,
  };
}
