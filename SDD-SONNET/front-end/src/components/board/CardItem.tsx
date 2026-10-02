"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare } from "lucide-react";
import { assigneeMembers } from "@/lib/assignees";
import { can } from "@/lib/permissions";
import type { CardSummary } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { DueBadge } from "@/components/ui/DueBadge";
import { LabelChip } from "@/components/ui/LabelChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useBoardContext } from "./BoardContext";

/** Corpo do card na lista, como no protótipo: etiquetas, título, progresso, prazo, comentários, responsáveis. */
export function CardPreview({ card }: { card: CardSummary }) {
  const { data, today } = useBoardContext();
  const labels = data.labels.filter((label) => card.labelIds.includes(label.id));
  const assignees = assigneeMembers(data.members, card.assigneeIds);
  const hasMeta = card.dueDate !== null || card.commentCount > 0 || assignees.length > 0;

  return (
    <div className="space-y-[11px]">
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </div>
      ) : null}
      <p
        className={`break-words text-[15.5px] font-medium leading-normal ${
          card.completed ? "text-placeholder line-through" : "text-ink"
        }`}
      >
        {card.title}
      </p>
      <ProgressBar progress={card.progress} />
      {hasMeta ? (
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <DueBadge card={card} today={today} />
            {card.commentCount > 0 ? (
              <span
                className="flex items-center gap-[5px] text-[13px] text-muted"
                aria-label={`${card.commentCount} comentários`}
              >
                <MessageSquare size={13} aria-hidden />
                {card.commentCount}
              </span>
            ) : null}
          </div>
          {assignees.length > 0 ? (
            <div className="flex shrink-0 items-center -space-x-[5px]">
              {assignees.map((member) => (
                <Avatar key={member.userId} id={member.userId} name={member.name} size={25} ring />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CardItem({ card }: { card: CardSummary }) {
  const { role, openCard, dragDisabled } = useBoardContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
    disabled: !can(role, "card.manage") || dragDisabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Abrir card ${card.title}`}
        onClick={() => openCard(card.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter") openCard(card.id);
          else listeners?.onKeyDown?.(event);
        }}
        className="cursor-pointer rounded-[10px] border border-border bg-surface p-[15px] text-left hover:border-check-border focus-visible:outline-2 focus-visible:outline-navy"
      >
        <CardPreview card={card} />
      </div>
    </li>
  );
}
