"use client";

import Link from "next/link";
import { useState } from "react";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { RoleBadge } from "@/components/RoleBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api";
import { useBoards, useDeleteBoard } from "@/lib/boards";
import type { BoardSummary } from "@/lib/types";

export default function BoardsPage() {
  const boards = useBoards();
  const deleteBoard = useDeleteBoard();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Meus quadros</h1>
        <Button onClick={() => setCreating(true)}>Novo quadro</Button>
      </div>

      {boards.isPending && <Spinner />}
      {boards.isError && <Alert>{errorMessage(boards.error)}</Alert>}

      {boards.data && boards.data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="font-medium text-slate-800">Você ainda não tem quadros.</p>
          <p className="mt-1 text-sm text-slate-500">
            Crie o primeiro para começar a organizar suas tarefas.
          </p>
          <Button className="mt-4" onClick={() => setCreating(true)}>
            Criar primeiro quadro
          </Button>
        </div>
      )}

      {boards.data && boards.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.data.map((board) => (
            <li
              key={board.id}
              className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/boards/${board.id}`}
                className="min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <h2 className="truncate text-base font-semibold text-slate-900">{board.name}</h2>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
                  {board.description ?? "Sem descrição"}
                </p>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RoleBadge role={board.role} />
                  <span>
                    {board.memberCount} {board.memberCount === 1 ? "membro" : "membros"}
                  </span>
                </div>
                {board.role === "admin" && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(board)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(board)}>
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
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
