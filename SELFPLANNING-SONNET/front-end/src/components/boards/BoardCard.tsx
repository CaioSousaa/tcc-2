"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/Button";
import type { BoardSummary } from "@/lib/types";

export function BoardCard({
  board,
  onEdit,
  onDelete,
}: {
  board: BoardSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAdmin = board.role === "ADMIN";
  const summary = [
    `${board.listCount} ${board.listCount === 1 ? "lista" : "listas"}`,
    `${board.cardCount} ${board.cardCount === 1 ? "card" : "cards"}`,
    board.overdueCount > 0
      ? `${board.overdueCount} ${board.overdueCount === 1 ? "atrasado" : "atrasados"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group relative rounded-xl border border-border bg-surface transition-shadow hover:shadow-md">
      <Link href={`/quadros/${board.id}`} className="block p-5">
        <div className="mb-8 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-ink">{board.name}</h3>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
              isAdmin ? "bg-navy text-white" : "bg-surface-alt text-muted"
            }`}
          >
            {isAdmin ? "ADMIN" : "MEMBRO"}
          </span>
        </div>
        <p className={`text-xs ${board.overdueCount > 0 ? "text-red" : "text-muted"}`}>
          {summary}
        </p>
      </Link>
      {isAdmin && (
        <div className="absolute right-3 bottom-3 flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconButton aria-label="Editar quadro" onClick={onEdit}>
            <Pencil size={14} />
          </IconButton>
          <IconButton aria-label="Excluir quadro" onClick={onDelete}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )}
    </div>
  );
}
