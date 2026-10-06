"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import type { BoardList, BoardMember, CardSummary, Label } from "@/lib/types";
import { CardItem } from "./CardItem";

export const listDndId = (id: string) => `list:${id}`;
export const listBodyDndId = (id: string) => `list-body:${id}`;
export const cardDndId = (id: string) => `card:${id}`;

interface SharedProps {
  labelsById: Map<string, Label>;
  membersById: Map<string, BoardMember>;
  dragEnabled: boolean;
  onOpenCard: (cardId: string) => void;
}

function SortableCard({
  card,
  listId,
  labelsById,
  membersById,
  dragEnabled,
  onOpenCard,
}: SharedProps & { card: CardSummary; listId: string }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: cardDndId(card.id),
      data: { type: "card", cardId: card.id, listId },
      disabled: !dragEnabled,
    });

  return (
    <CardItem
      ref={setNodeRef}
      card={card}
      labelsById={labelsById}
      membersById={membersById}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Abrir card ${card.title}`}
      onClick={() => onOpenCard(card.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpenCard(card.id);
        listeners?.onKeyDown?.(event);
      }}
    />
  );
}

interface ListColumnProps extends SharedProps {
  list: BoardList;
  /** Cards after filters/sorting; `list.cards` keeps the stored order. */
  visibleCards: CardSummary[];
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCreateCard: (title: string) => Promise<void>;
}

export function ListColumn({
  list,
  visibleCards,
  canManage,
  onEdit,
  onDelete,
  onCreateCard,
  ...shared
}: ListColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: listDndId(list.id),
      data: { type: "list", listId: list.id },
      disabled: !(shared.dragEnabled && canManage),
    });
  const { setNodeRef: setBodyRef } = useDroppable({
    id: listBodyDndId(list.id),
    data: { type: "list-body", listId: list.id },
    disabled: !shared.dragEnabled,
  });

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitCard() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreateCard(title.trim());
      setTitle("");
    } finally {
      setSaving(false);
    }
  }

  const hiddenCount = list.cards.length - visibleCards.length;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex max-h-full w-[351px] shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-list-bg p-4 ${
        isDragging ? "opacity-40" : ""
      }`}
      aria-label={`Lista ${list.title}`}
    >
      <header className="flex items-center justify-between gap-2 pb-0.5">
        <div
          className={`flex min-w-0 items-center gap-2 ${
            shared.dragEnabled && canManage ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          {...attributes}
          {...listeners}
          title={shared.dragEnabled && canManage ? "Arraste para reordenar a lista" : undefined}
        >
          <h2 className="truncate text-[17px] font-bold text-ink">{list.title}</h2>
          <span className="font-mono text-[13px] text-placeholder">{list.cards.length}</span>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-[7px]">
            <IconButton label="Editar lista" size={29} onClick={onEdit}>
              <Pencil size={13} />
            </IconButton>
            <IconButton label="Excluir lista" size={29} onClick={onDelete}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        )}
      </header>

      <div
        ref={setBodyRef}
        className="scrollbar-thin -mx-1 flex min-h-[8px] flex-col gap-3 overflow-y-auto px-1 pb-0.5"
      >
        <SortableContext
          items={visibleCards.map((card) => cardDndId(card.id))}
          strategy={verticalListSortingStrategy}
        >
          {visibleCards.map((card) => (
            <SortableCard key={card.id} card={card} listId={list.id} {...shared} />
          ))}
        </SortableContext>
        {hiddenCount > 0 && (
          <p className="text-center text-[13px] text-placeholder">
            {hiddenCount} card(s) oculto(s) pelo filtro
          </p>
        )}
      </div>

      {composing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            rows={2}
            placeholder="Título do card"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitCard();
              }
              if (event.key === "Escape") setComposing(false);
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={submitCard} disabled={!title.trim()}>
              Adicionar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setComposing(false);
                setTitle("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-strong text-[15.5px] text-muted transition hover:border-navy hover:bg-surface hover:text-ink"
        >
          <Plus size={14} /> Adicionar card
        </button>
      )}
    </section>
  );
}
