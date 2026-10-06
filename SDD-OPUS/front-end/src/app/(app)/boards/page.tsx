"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { Alert } from "@/components/ui/Alert";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api";
import { useBoards, useDeleteBoard } from "@/lib/boards";
import { boardColor } from "@/lib/palette";
import { ROLE_LABELS, type BoardSummary } from "@/lib/types";

export default function BoardsPage() {
  const boards = useBoards();
  const deleteBoard = useDeleteBoard();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);

  const adminCount = boards.data?.filter((board) => board.role === "admin").length ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-[1386px] flex-1 flex-col gap-9 px-6 pt-[60px] pb-16 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[34px] font-bold tracking-[-0.8px] text-ink">Meus quadros</h1>
          {boards.data && (
            <p className="text-[17px] text-muted">
              {boards.data.length} {boards.data.length === 1 ? "quadro" : "quadros"} · você é administrador em{" "}
              {adminCount}
            </p>
          )}
        </div>
        <Button onClick={() => setCreating(true)} className="h-[47px] gap-2.5 px-[22px]">
          <Plus size={15} aria-hidden="true" /> Novo quadro
        </Button>
      </div>

      {boards.isPending && <Spinner />}
      {boards.isError && <Alert>{errorMessage(boards.error)}</Alert>}

      {boards.data && boards.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-line-strong p-10 text-center">
          <p className="text-lg font-medium text-ink">Você ainda não tem quadros.</p>
          <p className="mt-1 text-[15px] text-muted">Crie o primeiro para começar a organizar suas tarefas.</p>
          <Button className="mt-5" onClick={() => setCreating(true)}>
            Criar primeiro quadro
          </Button>
        </div>
      )}

      {boards.data && boards.data.length > 0 && (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.data.map((board) => (
            <li
              key={board.id}
              className="relative flex h-[171px] flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true" className="h-1.5 w-full shrink-0" style={{ backgroundColor: boardColor(board.id) }} />
              <div className="flex flex-1 flex-col justify-between px-5 pt-5 pb-4">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/boards/${board.id}`}
                      className="line-clamp-2 min-w-0 flex-1 text-[19px] leading-[25px] font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-navy"
                    >
                      {board.name}
                    </Link>
                    {board.role === "admin" && (
                      <div className="relative z-10 flex gap-1.5">
                        <IconButton label={`Editar quadro ${board.name}`} onClick={() => setEditing(board)}>
                          <Pencil size={13} aria-hidden="true" />
                        </IconButton>
                        <IconButton label={`Excluir quadro ${board.name}`} onClick={() => setDeleting(board)}>
                          <Trash2 size={13} aria-hidden="true" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-1 text-[14.5px] text-muted">{board.description ?? "Sem descrição"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14.5px] text-muted">
                    {board.memberCount} {board.memberCount === 1 ? "membro" : "membros"}
                  </span>
                  <span className="font-mono text-[11px] font-medium tracking-[1.2px] text-muted uppercase">
                    {ROLE_LABELS[board.role]}
                  </span>
                </div>
              </div>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-[171px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-muted transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-navy"
            >
              <Plus size={18} aria-hidden="true" />
              <span className="text-base">Criar quadro</span>
            </button>
          </li>
        </ul>
      )}

      <BoardFormModal open={creating} onClose={() => setCreating(false)} />
      <BoardFormModal open={editing !== null} board={editing ?? undefined} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir quadro"
        confirmLabel="Excluir quadro"
        loading={deleteBoard.isPending}
        error={deleteBoard.isError ? errorMessage(deleteBoard.error) : null}
        onCancel={() => {
          setDeleting(null);
          deleteBoard.reset();
        }}
        onConfirm={() => {
          if (deleting) deleteBoard.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      >
        <p>
          O quadro <strong>{deleting?.name}</strong> será excluído permanentemente, com todas as
          listas, cards, checklists, etiquetas e comentários. Todos os membros perderão o acesso.
          Esta ação não pode ser desfeita.
        </p>
      </ConfirmDialog>
    </main>
  );
}
