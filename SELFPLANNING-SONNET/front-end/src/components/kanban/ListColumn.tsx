"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { api, errorMessage } from "@/lib/api";
import type { CardSummary, ListWithCards } from "@/lib/types";
import { SortableCard } from "./CardItem";

export function ListColumn({
  list,
  cards,
  isAdmin,
  cardDragDisabled,
  onOpenCard,
  onCardCreated,
  onEdit,
  onDelete,
  onError,
}: {
  list: ListWithCards;
  cards: CardSummary[];
  isAdmin: boolean;
  cardDragDisabled: boolean;
  onOpenCard: (cardId: string) => void;
  onCardCreated: (card: CardSummary) => void;
  onEdit: () => void;
  onDelete: () => void;
  onError: (message: string) => void;
}) {
  const sortable = useSortable({
    id: `list:${list.id}`,
    data: { type: "list" },
    disabled: !isAdmin,
  });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      const { data } = await api.post<CardSummary>(`/lists/${list.id}/cards`, { title: value });
      onCardCreated(data);
      setTitle("");
    } catch (err) {
      onError(errorMessage(err));
    }
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`flex max-h-full w-[351px] shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-[#F4F5F8] p-4 ${
        sortable.isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between pb-0.5">
        <div
          {...(isAdmin ? sortable.attributes : {})}
          {...(isAdmin ? sortable.listeners : {})}
          className={`flex min-w-0 items-center gap-2 ${isAdmin ? "cursor-grab" : ""}`}
        >
          <h3 className="truncate text-[17px] font-bold text-ink">{list.name}</h3>
          <span className="font-mono text-[13px] text-placeholder">{list.cards.length}</span>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-[7px]">
            <IconButton size={29} aria-label="Editar lista" onClick={onEdit}>
              <Pencil size={13} />
            </IconButton>
            <IconButton size={29} aria-label="Excluir lista" onClick={onDelete}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={cardDragDisabled}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={addCard} className="flex flex-col gap-2">
          <textarea
            autoFocus
            rows={2}
            value={title}
            maxLength={200}
            placeholder="Título do card"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-[15px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!title.trim()}>
              Adicionar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15.5px] text-muted hover:bg-black/5 hover:text-ink"
        >
          <Plus size={14} /> Adicionar card
        </button>
      )}
    </div>
  );
}
