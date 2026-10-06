"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { LabelChip } from "@/components/ui/LabelChip";
import type { CardSummary } from "@/lib/types";
import { DueBadge } from "./DueBadge";

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={`h-1 flex-1 rounded-[2px] bg-[#E4E6EB] ${className}`}>
      <div className="h-full rounded-[2px] bg-green" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function CardView({ card }: { card: CardSummary }) {
  const hasMeta = card.dueDate || card.assignees.length > 0 || card.commentCount > 0;
  return (
    <div className="flex flex-col gap-[11px] rounded-[10px] border border-border bg-surface p-[15px] text-left">
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((l) => (
            <LabelChip key={l.id} name={l.name} color={l.color} />
          ))}
        </div>
      )}
      <p className="text-[15.5px] leading-[23px] font-medium text-ink">{card.title}</p>

      {card.progress && (
        <div className="flex items-center gap-3">
          <ProgressBar percent={card.progress.percent} />
          <span className="font-mono text-[12.5px] text-muted">
            {card.progress.done}/{card.progress.total}
          </span>
        </div>
      )}

      {hasMeta && (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <DueBadge card={card} />
            {card.commentCount > 0 && (
              <span className="inline-flex items-center gap-[5px] text-[13px] text-muted">
                <MessageSquare size={13} />
                {card.commentCount}
              </span>
            )}
          </div>
          <div className="ml-auto">
            <AvatarStack
              people={card.assignees.map((u) => ({ id: u.id, name: u.name }))}
              size={25}
              overlap={5}
              max={3}
            />
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
