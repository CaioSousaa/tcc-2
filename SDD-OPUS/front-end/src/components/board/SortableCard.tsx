"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardView } from "./CardView";
import type { CardSummary, Label, Member } from "@/lib/types";

interface SortableCardProps {
  card: CardSummary;
  listId: string;
  labelsById: ReadonlyMap<string, Label>;
  membersById: ReadonlyMap<string, Member>;
  today: string;
  canMove: boolean;
  onOpen: (cardId: string) => void;
}

/**
 * A card that can be dragged with the pointer or with the keyboard (Space to pick up, arrows to
 * move, Space/Enter to drop). Click, or Enter outside a drag, opens it (R-34).
 */
export function SortableCard({
  card,
  listId,
  labelsById,
  membersById,
  today,
  canMove,
  onOpen,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId },
    disabled: !canMove,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : undefined}
    >
      <button
        type="button"
        onClick={() => onOpen(card.id)}
        aria-label={`Abrir card ${card.title}`}
        className="block w-full cursor-pointer rounded-lg text-left focus-visible:outline-2 focus-visible:outline-indigo-600"
        {...attributes}
        {...listeners}
      >
        <CardView card={card} labelsById={labelsById} membersById={membersById} today={today} />
      </button>
    </li>
  );
}
