"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare } from "lucide-react";
import type { CardSummary } from "@/lib/types";
import { getDueStatus } from "@/lib/dates";
import { AvatarStack } from "@/components/ui/Avatar";
import { LabelChip } from "@/components/ui/LabelChip";
import { DueBadge } from "./DueBadge";
import { ProgressBar } from "./ProgressBar";

interface CardViewProps extends React.HTMLAttributes<HTMLDivElement> {
  card: CardSummary;
  dragging?: boolean;
  overlay?: boolean;
}

export const CardView = forwardRef<HTMLDivElement, CardViewProps>(function CardView(
  { card, dragging, overlay, className = "", ...props },
  ref,
) {
  const { done, total } = card.checklistProgress;
  const overdue = getDueStatus(card.dueDate, card.completed) === "overdue";
  const hasMeta = Boolean(card.dueDate) || card.commentCount > 0 || card.assignees.length > 0;

  return (
    <div
      ref={ref}
      className={`flex cursor-pointer flex-col gap-[11px] rounded-[10px] border bg-surface p-[15px] text-left transition-shadow hover:shadow-[0_4px_14px_rgba(26,31,44,0.08)] ${
        overdue ? "border-red-border" : "border-border"
      } ${dragging ? "opacity-40" : ""} ${overlay ? "rotate-[1.5deg] shadow-[0_16px_32px_rgba(26,31,44,0.18)]" : ""} ${className}`}
      {...props}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </div>
      )}

      <p
        className={`text-[15.5px] font-medium leading-[1.5] ${
          card.completed ? "text-muted line-through decoration-muted/60" : "text-ink"
        }`}
      >
        {card.title}
      </p>

      {total > 0 && (
        <div className="flex items-center gap-3">
          <ProgressBar done={done} total={total} />
          <span className="font-mono text-[12.5px] text-muted">
            {done}/{total}
          </span>
        </div>
      )}

      {hasMeta && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <DueBadge dueDate={card.dueDate} completed={card.completed} />
            {card.commentCount > 0 && (
              <span className="inline-flex items-center gap-[5px] text-[13px] text-muted">
                <MessageSquare className="size-[13px]" />
                {card.commentCount}
              </span>
            )}
          </div>
          {card.assignees.length > 0 && <AvatarStack users={card.assignees} size={25} max={3} />}
        </div>
      )}
    </div>
  );
});

interface SortableCardProps {
  card: CardSummary;
  disabled: boolean;
  onOpen: (cardId: string) => void;
}

export function SortableCard({ card, disabled, onOpen }: SortableCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
    disabled,
  });

  return (
    <CardView
      ref={setNodeRef}
      card={card}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={() => onOpen(card.id)}
      {...attributes}
      {...listeners}
    />
  );
}
