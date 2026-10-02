"use client";

import Link from "next/link";
import { ChevronLeft, Pencil, Tag, Users } from "lucide-react";
import type { BoardDetail } from "@/lib/types";
import { AvatarStack } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";

interface BoardHeaderProps {
  board: BoardDetail;
  onEditBoard: () => void;
  onOpenLabels: () => void;
  onOpenMembers: () => void;
}

export function BoardHeader({ board, onEditBoard, onOpenLabels, onOpenMembers }: BoardHeaderProps) {
  const headerButton =
    "flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-[18px] text-[15.5px] font-medium text-ink hover:bg-surface-alt";

  return (
    <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface py-3 pl-[34px] pr-8">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/boards" className="flex items-center gap-2.5 text-base text-muted hover:text-ink">
          <ChevronLeft className="size-[15px]" />
          Quadros
        </Link>
        <span className="h-6 w-px bg-border" />
        <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: board.color }} />
        <h1 className="truncate text-[19px] font-bold tracking-[-0.2px] text-ink" title={board.description ?? undefined}>
          {board.title}
        </h1>
        {board.role === "admin" && (
          <IconButton icon={Pencil} label="Editar quadro" size={32} onClick={onEditBoard} />
        )}
      </div>
      <div className="flex items-center gap-3.5">
        <button type="button" onClick={onOpenLabels} className={headerButton}>
          <Tag className="size-[15px]" />
          Etiquetas
        </button>
        <button type="button" onClick={onOpenMembers} className={headerButton}>
          <Users className="size-[15px]" />
          Membros
        </button>
        <button type="button" onClick={onOpenMembers} aria-label="Ver membros">
          <AvatarStack users={board.members} size={32} max={5} />
        </button>
      </div>
    </header>
  );
}
