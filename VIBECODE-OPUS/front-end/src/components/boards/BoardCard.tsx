import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { SOLID } from "@/lib/colors";
import type { BoardSummary } from "@/lib/types";

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function BoardCard({
  board,
  onEdit,
  onDelete,
}: {
  board: BoardSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAdmin = board.role === "admin";

  return (
    <article className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md">
      <span className="h-1 w-full" style={{ background: SOLID[board.color] }} />
      <Link
        href={`/boards/${board.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Abrir quadro ${board.title}`}
      />
      <div className="flex flex-1 flex-col p-5 pt-[21px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-[19px] leading-[1.35] text-ink">{board.title}</h2>
          <div className="relative z-10 flex gap-2">
            {isAdmin && (
              <IconButton label="Editar quadro" size={32} onClick={onEdit}>
                <Pencil size={13} />
              </IconButton>
            )}
            {board.isOwner && (
              <IconButton label="Excluir quadro" size={32} onClick={onDelete}>
                <Trash2 size={13} />
              </IconButton>
            )}
          </div>
        </div>
        <p className="mt-3 text-[15px] text-muted">
          {plural(board.listCount, "lista", "listas")} ·{" "}
          {plural(board.cardCount, "card", "cards")}
          {board.overdueCount > 0 && (
            <span className="text-red">
              {" "}
              · {plural(board.overdueCount, "atrasado", "atrasados")}
            </span>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <AvatarStack users={board.members} size={25} />
          <span className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
            {isAdmin ? "Admin" : "Membro"}
          </span>
        </div>
      </div>
    </article>
  );
}
