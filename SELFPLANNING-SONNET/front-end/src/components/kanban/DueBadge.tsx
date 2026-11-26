import { Clock3 } from "lucide-react";
import { formatDay } from "@/lib/dates";
import type { CardSummary } from "@/lib/types";

type DueCard = Pick<CardSummary, "dueDate" | "isOverdue" | "isDueSoon" | "daysDiff">;

export function dueText(card: Pick<CardSummary, "dueDate" | "isOverdue" | "daysDiff">): string | null {
  if (!card.dueDate || card.daysDiff === null) return null;
  if (card.isOverdue) {
    const days = Math.abs(card.daysDiff);
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (card.daysDiff === 0) return "Vence hoje";
  return `Vence ${formatDay(card.dueDate)}`;
}

export function dueTone(card: Pick<DueCard, "isOverdue" | "isDueSoon">) {
  if (card.isOverdue) return "bg-red-bg text-red";
  if (card.isDueSoon) return "bg-amber-bg text-amber-text";
  return "bg-[#F1F2F5] text-muted";
}

export function DueBadge({ card, block = false }: { card: DueCard; block?: boolean }) {
  const text = dueText(card);
  if (!text) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md text-[13px] font-medium ${dueTone(card)} ${
        block ? "h-[30px] w-full gap-[7px] px-3" : "gap-[7px] px-2.5 py-[5px]"
      }`}
    >
      <Clock3 size={13} />
      {text}
    </span>
  );
}
