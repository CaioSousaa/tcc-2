"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LabelChip } from "@/components/ui/LabelChip";
import type { CardSummary } from "@/lib/types";
import { DueBadge } from "./DueBadge";

export function CardView({ card }: { card: CardSummary }) {
  return (
    <div
      className={`rounded-lg border bg-surface p-3 text-left shadow-sm ${
        card.isOverdue ? "border-red/40" : "border-border"
      }`}
    >
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <LabelChip key={l.id} name={l.name} color={l.color} compact />
          ))}
        </div>
      )}
      <p className="text-sm font-medium leading-snug text-ink">{card.title}</p>

      {card.progress && (
        <div className="mt-2.5 flex items-center gap-2">
          <CheckSquare size={12} className="shrink-0 text-muted" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full ${card.progress.percent === 100 ? "bg-green" : "bg-blue"}`}
              style={{ width: `${card.progress.percent}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted">
            {card.progress.done}/{card.progress.total}
          </span>
        </div>
      )}

      {(card.dueDate || card.assignees.length > 0 || card.commentCount > 0) && (
        <div className="mt-2.5 flex items-center gap-2">
          <DueBadge card={card} />
          {card.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <MessageSquare size={11} />
              {card.commentCount}
            </span>
          )}
          <div className="ml-auto flex -space-x-1.5">
            {card.assignees.map((u) => (
              <Avatar key={u.id} name={u.name} seed={u.id} size={22} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SortableCard({
  card,
  disabled,
  onOpen,
}: {
  card: CardSummary;
  disabled: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", listId: card.listId },
      disabled,
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-manipulation ${isDragging ? "opacity-40" : ""} ${disabled ? "" : "cursor-grab"}`}
      onClick={onOpen}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} />
    </div>
  );
}
