"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  onRenamed,
  onDelete,
  onError,
}: {
  list: ListWithCards;
  cards: CardSummary[];
  isAdmin: boolean;
  cardDragDisabled: boolean;
  onOpenCard: (cardId: string) => void;
  onCardCreated: (card: CardSummary) => void;
  onRenamed: (listId: string, name: string) => void;
  onDelete: () => void;
  onError: (message: string) => void;
}) {
  const sortable = useSortable({
    id: `list:${list.id}`,
    data: { type: "list" },
    disabled: !isAdmin,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  async function saveName() {
    setRenaming(false);
    const next = name.trim();
    if (!next || next === list.name) {
      setName(list.name);
      return;
    }
    try {
      await api.patch(`/lists/${list.id}`, { name: next });
      onRenamed(list.id, next);
    } catch (err) {
      setName(list.name);
      onError(errorMessage(err));
    }
  }

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
      className={`flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-surface-alt ${
        sortable.isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        {isAdmin && (
          <span
            {...sortable.attributes}
            {...sortable.listeners}
            className="cursor-grab text-placeholder hover:text-muted"
            aria-label="Arrastar lista"
          >
            <GripVertical size={14} />
          </span>
        )}
        {renaming ? (
          <input
            autoFocus
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(list.name);
                setRenaming(false);
              }
            }}
            className="h-7 min-w-0 flex-1 rounded border border-navy bg-surface px-2 text-sm font-semibold text-ink focus:outline-none"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{list.name}</h3>
        )}
        <span className="rounded-full bg-black/5 px-2 text-xs font-medium text-muted">
          {list.cards.length}
        </span>
        {isAdmin && (
          <div ref={menuRef} className="relative">
            <IconButton aria-label="Menu da lista" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal size={16} />
            </IconButton>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-body hover:bg-surface-alt"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                >
                  <Pencil size={14} /> Renomear
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red hover:bg-red-bg"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={14} /> Excluir lista
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={cardDragDisabled}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-placeholder">Nenhum card</p>
        )}
      </div>

      <div className="px-2 pb-2">
        {adding ? (
          <form onSubmit={addCard} className="space-y-2">
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
              className="w-full resize-none rounded-lg border border-border bg-surface p-2 text-sm text-ink focus:border-navy focus:outline-none"
            />
            <div className="flex gap-2">
              <Button type="submit" className="h-8" disabled={!title.trim()}>
                Adicionar
              </Button>
              <Button type="button" variant="ghost" className="h-8" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted hover:bg-black/5 hover:text-ink"
          >
            <Plus size={14} /> Adicionar card
          </button>
        )}
      </div>
    </div>
  );
}
