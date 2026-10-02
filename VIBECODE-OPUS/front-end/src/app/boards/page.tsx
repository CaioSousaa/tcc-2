"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { RequireAuth } from "@/components/auth/RouteGuards";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { InvitationsPanel } from "@/components/boards/InvitationsPanel";
import { TopBar } from "@/components/boards/TopBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardSummary, Invitation } from "@/lib/types";

function BoardsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [boardsResponse, invitationsResponse] = await Promise.all([
        api.get<{ boards: BoardSummary[] }>("/boards"),
        api.get<{ invitations: Invitation[] }>("/invitations"),
      ]);
      setBoards(boardsResponse.data.boards);
      setInvitations(invitationsResponse.data.invitations);
      setLoadError(null);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Não foi possível carregar seus quadros"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/boards/${deleting.id}`);
      toast.success("Quadro excluído");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  const adminCount = boards?.filter((board) => board.role === "admin").length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1322px] flex-1 px-6 py-12 sm:py-[60px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-ink">Meus quadros</h1>
            {boards && (
              <p className="mt-1.5 text-[17px] text-muted">
                {boards.length} {boards.length === 1 ? "quadro" : "quadros"} · você é
                administrador em {adminCount}
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={15} /> Novo quadro
          </Button>
        </div>

        <InvitationsPanel
          invitations={invitations}
          onChanged={(acceptedBoardId) => {
            if (acceptedBoardId) router.push(`/boards/${acceptedBoardId}`);
            else load();
          }}
        />

        {loadError && (
          <p className="rounded-lg bg-red-bg px-4 py-3 text-[15px] text-red">{loadError}</p>
        )}
        {!boards && !loadError && <Spinner label="Carregando quadros..." />}

        {boards && (
          <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={() => {
                  setEditing(board);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(board)}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex min-h-[188px] flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-outline-strong bg-transparent text-muted transition hover:border-navy hover:text-ink"
            >
              <Plus size={18} />
              <span className="text-[16px]">Criar quadro</span>
            </button>
          </div>
        )}
      </main>

      <BoardFormModal
        open={formOpen}
        board={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(board) => {
          setFormOpen(false);
          if (editing) load();
          else router.push(`/boards/${board.id}`);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Excluir o quadro “${deleting?.title ?? ""}”?`}
        description="Todas as listas, cards, checklists, comentários e etiquetas deste quadro serão apagados. Esta ação não pode ser desfeita."
        confirmLabel="Excluir quadro"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

export default function BoardsPage() {
  return (
    <RequireAuth>
      <BoardsScreen />
    </RequireAuth>
  );
}
