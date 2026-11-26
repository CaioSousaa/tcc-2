"use client";

import { LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, toApiError, type ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_TAGS } from "@/lib/constants";
import { todayLocal } from "@/lib/date";
import { boardSummaryText, boardsSubtitle } from "@/lib/format";
import { can } from "@/lib/permissions";
import { BOARD_STYLES } from "@/lib/palette";
import type { BoardSummary } from "@/lib/types";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button, IconButton, Spinner } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { BoardFormDialog, type BoardFormValue } from "./BoardFormDialog";

export function BoardsPage() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await api.get<BoardSummary[]>("/boards", {
        params: { today: todayLocal() },
      });
      setBoards(response.data);
      setError(null);
    } catch (cause) {
      setError(toApiError(cause));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!boards) return null;
    const term = query.trim().toLowerCase();
    return term ? boards.filter((board) => board.name.toLowerCase().includes(term)) : boards;
  }, [boards, query]);

  async function createBoard(value: BoardFormValue) {
    await api.post("/boards", value);
    await load();
  }

  async function updateBoard(value: BoardFormValue) {
    if (!editing) return;
    await api.patch(`/boards/${editing.id}`, { name: value.name, color: value.color });
    await load();
  }

  async function deleteBoard() {
    if (!deleting) return;
    try {
      await api.delete(`/boards/${deleting.id}`);
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
    setDeleting(null);
    await load();
  }

  return (
    <>
      <header className="flex h-[78px] items-center justify-between gap-4 border-b border-border bg-surface px-6 sm:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <label className="hidden h-11 w-[325px] items-center gap-3 rounded-lg border border-border bg-surface-alt px-4 md:flex">
            <Search size={14} className="shrink-0 text-muted" aria-hidden />
            <input
              type="search"
              aria-label="Buscar quadros"
              placeholder="Buscar quadros"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-placeholder"
            />
          </label>
          <span className="flex items-center gap-2.5">
            <Avatar id={user.id} name={user.name} size={38} />
            <span className="hidden text-base text-ink sm:inline">{user.name}</span>
          </span>
          <IconButton icon={LogOut} label="Sair" size={34} onClick={logout} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1322px] flex-1 space-y-9 px-6 pb-16 pt-[60px] sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[34px] font-bold tracking-[-0.8px] text-ink">Meus quadros</h1>
            {boards ? (
              <p className="text-[17px] text-muted">{boardsSubtitle(boards)}</p>
            ) : null}
          </div>
          <Button icon={Plus} className="h-[47px] px-[22px]" onClick={() => setCreating(true)}>
            Novo quadro
          </Button>
        </div>

        {error && boards === null ? (
          <EmptyState
            title="Não foi possível carregar seus quadros"
            description={error.message}
            action={<Button onClick={load}>Tentar de novo</Button>}
          />
        ) : visible === null ? (
          <div className="flex justify-center py-16 text-muted">
            <Spinner className="h-6 w-6" />
          </div>
        ) : boards && boards.length === 0 ? (
          <EmptyState
            title="Você ainda não participa de nenhum quadro"
            description="Crie o seu primeiro quadro para começar a organizar tarefas."
            action={<Button onClick={() => setCreating(true)}>Criar primeiro quadro</Button>}
          />
        ) : (
          <>
            {visible.length === 0 ? (
              <p role="status" className="text-[15px] text-muted">
                Nenhum quadro corresponde à busca.
              </p>
            ) : null}
            <ul className="grid gap-x-6 gap-y-[22px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((board) => (
                <BoardTile
                  key={board.id}
                  board={board}
                  onEdit={() => setEditing(board)}
                  onDelete={() => setDeleting(board)}
                />
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex h-[187px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-soft text-base text-muted hover:bg-black/[0.02]"
                >
                  <Plus size={18} aria-hidden />
                  Criar quadro
                </button>
              </li>
            </ul>
          </>
        )}
      </main>

      <BoardFormDialog
        open={creating}
        mode="create"
        onSubmit={createBoard}
        onClose={() => setCreating(false)}
      />
      <BoardFormDialog
        open={editing !== null}
        mode="edit"
        initial={editing ? { name: editing.name, color: editing.color } : undefined}
        onSubmit={updateBoard}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Excluir o quadro “${deleting?.name ?? ""}”?`}
        confirmLabel="Excluir quadro"
        onConfirm={deleteBoard}
        onClose={() => setDeleting(null)}
      >
        <p>
          Todas as listas, cards, checklists, etiquetas e comentários serão removidos
          definitivamente e os membros perderão o acesso. Esta ação não pode ser desfeita.
        </p>
      </ConfirmDialog>
    </>
  );
}

function BoardTile({
  board,
  onEdit,
  onDelete,
}: {
  board: BoardSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAdmin = can(board.role, "board.update");
  return (
    <li className="relative flex h-[171px] flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow focus-within:shadow-md hover:shadow-md">
      <span className={`h-1.5 w-full shrink-0 ${BOARD_STYLES[board.color].band}`} aria-hidden />
      <div className="flex flex-1 flex-col justify-between px-5 pb-4 pt-5">
        <div className="space-y-3">
          <div className="flex gap-3">
            <h2 className="min-w-0 flex-1 text-[19px] font-medium leading-[1.3] text-ink">
              <Link
                href={`/boards/${board.id}`}
                className="line-clamp-2 break-words after:absolute after:inset-0 focus-visible:outline-none"
              >
                {board.name}
              </Link>
            </h2>
            {isAdmin ? (
              <div className="relative z-10 flex shrink-0 gap-1.5">
                <IconButton icon={Pencil} label={`Editar ${board.name}`} size={32} onClick={onEdit} />
                <IconButton icon={Trash2} label={`Excluir ${board.name}`} size={32} onClick={onDelete} />
              </div>
            ) : null}
          </div>
          <p className="text-[14.5px] text-muted">{boardSummaryText(board)}</p>
        </div>
        <div className="flex items-center justify-between">
          <AvatarStack people={board.members.map((member) => ({ id: member.userId, name: member.name }))} />
          <span className="font-mono text-[11px] font-medium tracking-[1.2px] text-muted">
            {ROLE_TAGS[board.role]}
          </span>
        </div>
      </div>
    </li>
  );
}
