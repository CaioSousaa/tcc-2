import Link from "next/link";
import { ChevronLeft, Pencil, Tag, Users } from "lucide-react";
import { UserMenu } from "@/components/boards/TopBar";
import { AvatarStack } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { SOLID } from "@/lib/colors";
import type { BoardDetail } from "@/lib/types";

const HEADER_BUTTON =
  "inline-flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-[18px] text-[15.5px] font-medium text-ink transition hover:bg-surface-alt";

export function BoardHeader({
  data,
  onEditBoard,
  onOpenLabels,
  onOpenMembers,
}: {
  data: BoardDetail;
  onEditBoard: () => void;
  onOpenLabels: () => void;
  onOpenMembers: () => void;
}) {
  return (
    <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-border bg-surface py-3 pl-[34px] pr-8">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/boards"
          className="flex items-center gap-2.5 text-[16px] text-muted transition hover:text-ink"
        >
          <ChevronLeft size={15} /> Quadros
        </Link>
        <span className="h-6 w-px bg-border" />
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: SOLID[data.board.color] }}
          aria-hidden
        />
        <h1
          className="truncate text-[19px] font-bold tracking-tight text-ink"
          title={data.board.description ?? undefined}
        >
          {data.board.title}
        </h1>
        {data.role === "admin" && (
          <IconButton label="Editar quadro" size={32} onClick={onEditBoard}>
            <Pencil size={13} />
          </IconButton>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        <button type="button" className={HEADER_BUTTON} onClick={onOpenLabels}>
          <Tag size={15} /> Etiquetas
        </button>
        <button type="button" className={HEADER_BUTTON} onClick={onOpenMembers}>
          <Users size={15} /> Membros
        </button>
        <button
          type="button"
          onClick={onOpenMembers}
          aria-label="Ver membros do quadro"
          className="hidden sm:block"
        >
          <AvatarStack users={data.members.map((member) => member.user)} size={32} />
        </button>
        <span className="h-6 w-px bg-border" />
        <UserMenu compact />
      </div>
    </header>
  );
}
