"use client";

import { useEffect, useRef, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Plus, Trash } from "lucide-react";
import type { BoardList, CardSummary } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SortableCard } from "./CardItem";

interface ListColumnProps {
  list: BoardList;
  cards: CardSummary[];
  totalCards: number;
  isAdmin: boolean;
  cardDragDisabled: boolean;
  listDragDisabled: boolean;
  onOpenCard: (cardId: string) => void;
  onAddCard: (listId: string, title: string) => Promise<void>;
  onEditList: (list: BoardList) => void;
  onDeleteList: (list: BoardList) => void;
}

export function listDndId(listId: string) {
  return `list-${listId}`;
}

export function ListColumn({
  list,
  cards,
  totalCards,
  isAdmin,
  cardDragDisabled,
  listDragDisabled,
  onOpenCard,
  onAddCard,
  onEditList,
  onDeleteList,
}: ListColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: listDndId(list.id),
    data: { type: "list", listId: list.id },
    disabled: listDragDisabled,
  });

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (adding) textareaRef.current?.focus();
  }, [adding]);

  async function submit() {
    const value = title.trim();
    if (!value) {
      setAdding(false);
      return;
    }
    setSaving(true);
    try {
      await onAddCard(list.id, value);
      setTitle("");
      textareaRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  const filtered = cards.length !== totalCards;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex max-h-full w-[340px] shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-list p-4 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <header
        className={`flex items-center justify-between pb-0.5 ${listDragDisabled ? "" : "cursor-grab active:cursor-grabbing"}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[17px] font-bold text-ink">{list.title}</h2>
          <span className="text-[13px] text-placeholder">
            {filtered ? `${cards.length}/${totalCards}` : totalCards}
          </span>
        </div>
        {isAdmin && (
          <div className="flex gap-[7px]" onPointerDown={(e) => e.stopPropagation()}>
            <IconButton icon={Pencil} label="Editar lista" size={29} onClick={() => onEditList(list)} />
            <IconButton icon={Trash} label="Excluir lista" size={29} onClick={() => onDeleteList(list)} />
          </div>
        )}
      </header>

      <div className="board-scroll -mx-1 flex min-h-[8px] flex-col gap-3 overflow-y-auto px-1 pb-0.5">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={cardDragDisabled}
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && filtered && (
          <p className="py-2 text-center text-[13.5px] text-placeholder">Nenhum card com este filtro</p>
        )}
      </div>

      {adding ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={title}
            placeholder="Título do card"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setTitle("");
              }
            }}
            className="w-full resize-none rounded-[10px] border border-border bg-surface p-3 text-[15px] text-ink outline-none focus:border-navy"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} loading={saving}>
              Adicionar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
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
          onClick={() => setAdding(true)}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed border-dash text-[15.5px] text-muted transition-colors hover:border-muted hover:bg-surface hover:text-ink"
        >
          <Plus className="size-3.5" />
          Adicionar card
        </button>
      )}
    </section>
  );
}
