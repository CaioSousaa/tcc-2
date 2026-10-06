"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { can } from "@/lib/permissions";
import type { ListWithCards } from "@/lib/types";
import { IconButton } from "@/components/ui/Button";
import { useBoardContext } from "./BoardContext";

interface ListColumnProps {
  list: ListWithCards;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/** Coluna do protótipo: 351px, fundo #F4F5F8, raio 14, cabeçalho com nome, contagem e ações. */
export function ListColumn({ list, onEdit, onDelete, children }: ListColumnProps) {
  const { role } = useBoardContext();
  const canManage = can(role, "list.manage");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
    disabled: !canManage,
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`Lista ${list.name}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex max-h-full w-[351px] shrink-0 flex-col gap-3 rounded-[14px] border border-border bg-list-bg p-4 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2 pb-0.5">
        <div
          {...(canManage ? { ...attributes, ...listeners } : {})}
          className={`flex min-w-0 items-center gap-2 ${canManage ? "cursor-grab touch-none" : ""}`}
        >
          <h2 className="truncate text-[17px] font-bold text-ink">{list.name}</h2>
          <span className="font-mono text-[13px] text-placeholder">{list.cards.length}</span>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-[7px]">
            <IconButton icon={Pencil} label={`Editar lista ${list.name}`} size={29} onClick={onEdit} />
            <IconButton icon={Trash2} label={`Excluir lista ${list.name}`} size={29} onClick={onDelete} />
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}
