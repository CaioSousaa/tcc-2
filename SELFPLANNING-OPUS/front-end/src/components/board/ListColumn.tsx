"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import type { BoardListData, CardSummary } from "@/lib/types";
import { AddCardForm } from "./AddCardForm";
import { CardItem } from "./CardItem";
import { CARD_MIME, dropIndex, isDragOf, LIST_MIME } from "./dnd";

interface ListColumnProps {
  list: BoardListData;
  canEdit: boolean;
  /** Arrastar cards fica desabilitado com filtros ativos (a ordem visível é parcial) */
  cardDragEnabled: boolean;
  draggingCardId: string | null;
  cardDropIndex: number | null;
  listDragging: boolean;
  onOpenCard: (card: CardSummary) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddCard: (title: string) => Promise<void>;
  onCardDragStart: (card: CardSummary) => void;
  onCardDragOver: (index: number) => void;
  onCardDrop: (index: number) => void;
  onListDragStart: () => void;
  onDragEnd: () => void;
}

export function ListColumn({
  list,
  canEdit,
  cardDragEnabled,
  draggingCardId,
  cardDropIndex,
  listDragging,
  onOpenCard,
  onEdit,
  onDelete,
  onAddCard,
  onCardDragStart,
  onCardDragOver,
  onCardDrop,
  onListDragStart,
  onDragEnd,
}: ListColumnProps) {
  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    if (!isDragOf(event, CARD_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onCardDragOver(dropIndex(event.currentTarget, "[data-card-id]", event.clientY, "y"));
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    if (!isDragOf(event, CARD_MIME)) return;
    event.preventDefault();
    event.stopPropagation();
    onCardDrop(dropIndex(event.currentTarget, "[data-card-id]", event.clientY, "y"));
  }

  const indicator = <div className="h-[3px] shrink-0 rounded-full bg-navy" />;
  const hiddenCount = list.cardCount - list.cards.length;

  return (
    <section
      data-list-id={list.id}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex max-h-full w-[351px] shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-list p-4 ${
        listDragging ? "opacity-40" : ""
      }`}
    >
      <header
        draggable={canEdit}
        onDragStart={(event) => {
          event.dataTransfer.setData(LIST_MIME, list.id);
          event.dataTransfer.effectAllowed = "move";
          onListDragStart();
        }}
        onDragEnd={onDragEnd}
        className={`flex items-center justify-between pb-0.5 ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {canEdit && <GripVertical size={14} className="shrink-0 text-placeholder" />}
          <h3 className="truncate text-[17px] font-bold text-ink">{list.name}</h3>
          <span className="text-[13px] text-placeholder">{list.cardCount}</span>
        </div>
        {canEdit && (
          <div className="flex gap-[7px]">
            <IconButton label="Editar lista" size={29} onClick={onEdit}>
              <Pencil size={13} />
            </IconButton>
            <IconButton label="Excluir lista" size={29} onClick={onDelete}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        )}
      </header>

      <div className="-mx-1 flex min-h-[8px] flex-col gap-3 overflow-y-auto px-1">
        {list.cards.map((card, index) => (
          <div key={card.id} className="flex flex-col gap-3">
            {cardDropIndex === index && indicator}
            <CardItem
              card={card}
              draggable={canEdit && cardDragEnabled}
              dragging={draggingCardId === card.id}
              onOpen={() => onOpenCard(card)}
              onDragStart={(event) => {
                event.stopPropagation();
                event.dataTransfer.setData(CARD_MIME, card.id);
                event.dataTransfer.effectAllowed = "move";
                onCardDragStart(card);
              }}
              onDragEnd={onDragEnd}
            />
          </div>
        ))}
        {cardDropIndex === list.cards.length && indicator}
        {hiddenCount > 0 && (
          <p className="text-center text-[13px] text-placeholder">
            {hiddenCount} {hiddenCount === 1 ? "card oculto" : "cards ocultos"} pelo filtro
          </p>
        )}
      </div>

      {canEdit && <AddCardForm onAdd={onAddCard} />}
    </section>
  );
}
