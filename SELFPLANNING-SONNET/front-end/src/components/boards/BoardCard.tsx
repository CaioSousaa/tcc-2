"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/Avatar";
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
    <div className="relative flex min-h-[171px] flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: board.color }} />
      <div className="flex flex-1 flex-col justify-between gap-4 px-5 pt-5 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <h3 className="flex-1 text-[19px] leading-[25px] font-medium text-ink">
              {board.name}
            </h3>
            {isAdmin && <div className="h-8 w-[70px] shrink-0" />}
          </div>
          <p className="text-[14.5px] text-muted">{summary}</p>
        </div>
        <div className="flex items-center justify-between">
          <AvatarStack
            people={board.members.map((m) => ({ id: m.userId, name: m.name }))}
            size={26}
            overlap={6}
          />
          <span className="font-mono text-[11px] font-medium tracking-[1.2px] text-muted">
            {isAdmin ? "ADMIN" : "MEMBRO"}
          </span>
        </div>
      </div>
      <Link
        href={`/quadros/${board.id}`}
        aria-label={`Abrir quadro ${board.name}`}
        className="absolute inset-0"
      />
      {isAdmin && (
        <div className="absolute top-[26px] right-5 flex gap-1.5">
          <IconButton size={32} aria-label="Editar quadro" onClick={onEdit}>
            <Pencil size={13} />
          </IconButton>
          <IconButton size={32} aria-label="Excluir quadro" onClick={onDelete}>
            <Trash2 size={13} />
          </IconButton>
        </div>
      )}
    </div>
  );
}
