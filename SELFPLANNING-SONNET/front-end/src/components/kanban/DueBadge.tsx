import { CalendarClock } from "lucide-react";
import { formatDay } from "@/lib/dates";
import type { CardSummary } from "@/lib/types";

export function dueText(card: Pick<CardSummary, "dueDate" | "isOverdue" | "daysDiff">): string | null {
  if (!card.dueDate || card.daysDiff === null) return null;
  if (card.isOverdue) {
    const days = Math.abs(card.daysDiff);
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (card.daysDiff === 0) return "Vence hoje";
  return `Vence ${formatDay(card.dueDate)}`;
}

export function DueBadge({
  card,
}: {
  card: Pick<CardSummary, "dueDate" | "isOverdue" | "isDueSoon" | "daysDiff">;
}) {
  const text = dueText(card);
  if (!text) return null;
  const tone = card.isOverdue
    ? "bg-red-bg text-red-dark"
    : card.isDueSoon
      ? "bg-amber-bg text-amber-text"
      : "bg-surface-alt text-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${tone}`}>
      <CalendarClock size={11} />
      {text}
    </span>
  );
}
