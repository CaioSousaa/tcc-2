"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { plural, ROLE_TAGS } from "@/lib/format";
import type { BoardSummary } from "@/lib/types";

interface BoardTileProps {
  board: BoardSummary;
  onEdit: () => void;
  onDelete: () => void;
}

export function BoardTile({ board, onEdit, onDelete }: BoardTileProps) {
  const summary = [
    plural(board.listCount, "lista", "listas"),
    plural(board.cardCount, "card", "cards"),
    board.overdueCount > 0 ? plural(board.overdueCount, "atrasado", "atrasados") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="relative flex h-[171px] flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
      <div className="h-1.5 shrink-0" style={{ backgroundColor: board.color }} />
      <Link href={`/boards/${board.id}`} className="absolute inset-0" aria-label={`Abrir ${board.name}`} />
      <div className="flex flex-1 flex-col justify-between px-5 pb-4 pt-5">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <h3 className="line-clamp-2 flex-1 text-[19px] font-medium leading-[1.3] text-ink">{board.name}</h3>
            {board.role === "admin" && (
              <div className="relative z-10 flex gap-1.5">
                <IconButton label="Editar quadro" size={32} onClick={onEdit}>
                  <Pencil size={13} />
                </IconButton>
                <IconButton label="Excluir quadro" size={32} onClick={onDelete}>
                  <Trash2 size={13} />
                </IconButton>
              </div>
            )}
          </div>
          <p className="text-[14.5px] text-muted">{summary}</p>
        </div>
        <div className="flex items-center justify-between">
          <AvatarStack users={board.members.map((m) => m.user)} />
          <span className="font-mono text-[11px] font-medium tracking-[1.2px] text-muted">
            {ROLE_TAGS[board.role]}
          </span>
        </div>
      </div>
    </article>
  );
}
