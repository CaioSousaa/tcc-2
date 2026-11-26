"use client";

import { ChevronLeft, Pencil, Tag, Users } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { UserMenu } from "@/components/UserMenu";
import { ROLE_TAGS } from "@/lib/format";
import type { BoardDetail } from "@/lib/types";

interface BoardHeaderProps {
  board: BoardDetail;
  onEditBoard: () => void;
  onOpenLabels: () => void;
  onOpenMembers: () => void;
}

const headerButton =
  "inline-flex h-11 items-center gap-2.5 rounded-lg border border-border bg-white px-[18px] text-[15.5px] font-medium text-ink hover:bg-surface-alt";

export function BoardHeader({ board, onEditBoard, onOpenLabels, onOpenMembers }: BoardHeaderProps) {
  return (
    <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-6 py-3 md:pl-[34px] md:pr-8">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/boards" className="flex items-center gap-2.5 text-base text-muted hover:text-ink">
          <ChevronLeft size={15} /> Quadros
        </Link>
        <span className="h-6 w-px bg-border" />
        <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ backgroundColor: board.color }} />
        <h1 className="truncate text-[19px] font-bold text-ink">{board.name}</h1>
        {board.role === "admin" && (
          <IconButton label="Editar quadro" size={32} onClick={onEditBoard}>
            <Pencil size={13} />
          </IconButton>
        )}
        <span className="hidden font-mono text-[11px] font-medium tracking-[1.2px] text-muted sm:inline">
          {ROLE_TAGS[board.role]}
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <button type="button" onClick={onOpenLabels} className={headerButton}>
          <Tag size={15} /> Etiquetas
        </button>
        <button type="button" onClick={onOpenMembers} className={headerButton}>
          <Users size={15} /> Membros
        </button>
        <AvatarStack users={board.members.map((m) => m.user)} size={32} />
        <UserMenu showName={false} />
      </div>
    </header>
  );
}
