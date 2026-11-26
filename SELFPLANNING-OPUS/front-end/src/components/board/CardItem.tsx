"use client";

import { MessageSquare } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { LabelChip } from "@/components/ui/LabelChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CardSummary } from "@/lib/types";
import { DueBadge } from "./DueBadge";

interface CardItemProps {
  card: CardSummary;
  draggable: boolean;
  onOpen: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function CardItem({ card, draggable, onOpen, onDragStart, onDragEnd, dragging }: CardItemProps) {
  const progress = card.checklistProgress;
  const hasMeta = card.dueDate || card.commentCount > 0 || card.assignees.length > 0;

  return (
    <article
      data-card-id={card.id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`flex cursor-pointer flex-col gap-[11px] rounded-[10px] border bg-white p-[15px] transition-shadow hover:shadow-md ${
        card.overdue ? "border-red-border" : "border-border"
      } ${dragging ? "opacity-40" : ""}`}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </div>
      )}

      <h4
        className={`text-[15.5px] font-medium leading-snug ${
          card.completed ? "text-muted line-through decoration-1" : "text-ink"
        }`}
      >
        {card.title}
      </h4>

      {progress.total > 0 && (
        <div className="flex items-center gap-3">
          <ProgressBar percent={progress.percent} />
          <span className="shrink-0 text-[12.5px] text-muted">
            {progress.done}/{progress.total}
          </span>
        </div>
      )}

      {hasMeta && (
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {card.dueDate && (
              <DueBadge dueDate={card.dueDate} completed={card.completed} overdue={card.overdue} />
            )}
            {card.commentCount > 0 && (
              <span className="inline-flex items-center gap-[5px] text-[13px] text-muted">
                <MessageSquare size={13} />
                {card.commentCount}
              </span>
            )}
          </div>
          <AvatarStack users={card.assignees} size={25} max={3} />
        </div>
      )}
    </article>
  );
}
