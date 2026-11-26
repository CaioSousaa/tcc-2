"use client";

import { forwardRef } from "react";
import { MessageSquare } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { LabelChip } from "@/components/ui/LabelChip";
import type { BoardMember, CardSummary, Label } from "@/lib/types";
import { DueBadge } from "./DueBadge";

interface CardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  card: CardSummary;
  labelsById: Map<string, Label>;
  membersById: Map<string, BoardMember>;
  dragging?: boolean;
  overlay?: boolean;
}

export const CardItem = forwardRef<HTMLDivElement, CardItemProps>(function CardItem(
  { card, labelsById, membersById, dragging, overlay, className = "", ...props },
  ref,
) {
  const labels = card.labelIds
    .map((id) => labelsById.get(id))
    .filter((label): label is Label => Boolean(label));
  const assignees = card.assigneeIds
    .map((id) => membersById.get(id)?.user)
    .filter((user) => Boolean(user)) as BoardMember["user"][];
  const { total, done } = card.checklist;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const hasMeta =
    Boolean(card.dueDate) || card.commentCount > 0 || assignees.length > 0;

  return (
    <div
      ref={ref}
      className={`flex w-full cursor-pointer flex-col gap-[11px] rounded-[10px] border border-border bg-surface p-[15px] text-left transition hover:border-[#C9CED7] ${
        dragging ? "opacity-40" : ""
      } ${overlay ? "rotate-[2deg] shadow-xl" : ""} ${className}`}
      {...props}
    >
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </div>
      )}

      <p
        className={`text-[15.5px] font-medium leading-normal break-words ${
          card.completed ? "text-muted line-through decoration-1" : "text-ink"
        }`}
      >
        {card.title}
      </p>

      {total > 0 && (
        <div
          className="flex items-center gap-3"
          title={`Checklist: ${done} de ${total} itens concluídos (${progress}%)`}
        >
          <div className="h-1 flex-1 overflow-hidden rounded-sm bg-track">
            <div
              className="h-full rounded-sm bg-green transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
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
              <span
                className="inline-flex items-center gap-[5px] text-[13px] text-muted"
                title={`${card.commentCount} comentário(s)`}
              >
                <MessageSquare size={13} /> {card.commentCount}
              </span>
            )}
          </div>
          {assignees.length > 0 && <AvatarStack users={assignees} size={25} max={3} />}
        </div>
      )}
    </div>
  );
});
