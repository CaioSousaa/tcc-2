"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardSummary, Invitation } from "@/lib/types";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TopBar } from "@/components/TopBar";
import { BoardFormModal, type BoardFormValue } from "@/components/boards/BoardFormModal";
import { InvitationsBanner } from "@/components/boards/InvitationsBanner";
import { AvatarStack } from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { IconButton } from "@/components/ui/IconButton";
import { FullPageSpinner } from "@/components/ui/Spinner";

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function BoardCard({
  board,
  onEdit,
  onDelete,
}: {
  board: BoardSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const summary = [
    plural(board.listCount, "lista", "listas"),
    plural(board.cardCount, "card", "cards"),
  ];
  if (board.overdueCount > 0) {
    summary.push(plural(board.overdueCount, "atrasado", "atrasados"));
  }

  return (
    <div className="group relative flex min-h-[171px] flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-[0_8px_24px_rgba(26,31,44,0.08)]">
      <span className="h-1.5 w-full shrink-0" style={{ backgroundColor: board.color }} />
      <Link href={`/boards/${board.id}`} className="absolute inset-0 z-0" aria-label={`Abrir ${board.title}`} />
      <div className="pointer-events-none relative flex flex-1 flex-col justify-between px-5 pb-4 pt-5">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <h3 className="flex-1 text-[19px] font-medium leading-[1.3] text-ink">{board.title}</h3>
            {board.role === "admin" && (
              <div className="pointer-events-auto relative z-10 flex gap-1.5">
                <IconButton icon={Pencil} label="Editar quadro" size={32} onClick={onEdit} />
                {board.isOwner && (
                  <IconButton icon={Trash} label="Excluir quadro" size={32} onClick={onDelete} />
                )}
              </div>
            )}
          </div>
          <p className="text-[14.5px] text-muted">
            {summary.slice(0, 2).join(" · ")}
            {board.overdueCount > 0 && (
              <>
                {" · "}
                <span className="font-medium text-red">{summary[2]}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between pt-4">
          <AvatarStack users={board.members} size={26} />
          <span className="text-[11px] font-medium tracking-[1.2px] text-muted">
            {board.role === "admin" ? "ADMIN" : "MEMBRO"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BoardsDashboard() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BoardFormValue | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [boardsRes, invitesRes] = await Promise.all([
        api.get<{ boards: BoardSummary[] }>("/boards"),
        api.get<{ invitations: Invitation[] }>("/invitations"),
      ]);
      setBoards(boardsRes.data.boards);
      setInvitations(invitesRes.data.invitations);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar seus quadros."));
      setBoards((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adminCount = useMemo(
    () => (boards ?? []).filter((b) => b.role === "admin").length,
    [boards],
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/boards/${deleting.id}`);
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <TopBar />
      <main className="mx-auto flex w-full max-w-[1322px] flex-col gap-9 px-6 py-[60px] lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-bold tracking-[-0.8px] text-ink">Meus quadros</h1>
            {boards && (
              <p className="text-[17px] text-muted">
                {plural(boards.length, "quadro", "quadros")} · você é administrador em {adminCount}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex h-[47px] items-center gap-2.5 rounded-lg bg-navy px-[22px] text-[15px] font-semibold text-white hover:bg-navy-hover"
          >
            <Plus className="size-[15px]" strokeWidth={2.5} />
            Novo quadro
          </button>
        </div>

        <InvitationsBanner
          invitations={invitations}
          onChanged={(boardId) => (boardId ? router.push(`/boards/${boardId}`) : load())}
        />

        {error && <p className="rounded-lg bg-red-bg px-4 py-3 text-sm text-red-dark">{error}</p>}

        {!boards ? (
          <FullPageSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2 xl:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={() => {
                  setEditing({
                    id: board.id,
                    title: board.title,
                    description: board.description,
                    color: board.color,
                  });
                  setFormOpen(true);
                }}
                onDelete={() => {
                  setDeleteError(null);
                  setDeleting(board);
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex min-h-[187px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-dash text-base text-muted transition-colors hover:border-muted hover:text-ink"
            >
              <Plus className="size-[18px]" />
              Criar quadro
            </button>
          </div>
        )}
      </main>

      <BoardFormModal
        open={formOpen}
        board={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(boardId) => {
          setFormOpen(false);
          if (editing) load();
          else router.push(`/boards/${boardId}`);
        }}
      />

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Excluir o quadro “${deleting?.title ?? ""}”?`}
        description="Todas as listas, cards, checklists, etiquetas e comentários deste quadro serão apagados. Esta ação não pode ser desfeita."
        confirmLabel="Excluir quadro"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

export default function BoardsPage() {
  return (
    <RequireAuth>
      <BoardsDashboard />
    </RequireAuth>
  );
}
