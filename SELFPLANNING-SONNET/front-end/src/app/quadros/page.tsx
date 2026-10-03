"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardCard } from "@/components/boards/BoardCard";
import { NewBoardModal } from "@/components/boards/NewBoardModal";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { UserMenu } from "@/components/UserMenu";
import { api, errorMessage } from "@/lib/api";
import type { BoardSummary } from "@/lib/types";

function BoardsContent() {
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BoardSummary[]>("/boards");
      setBoards(data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (boards ?? []).filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, query]);

  const adminCount = (boards ?? []).filter((b) => b.role === "ADMIN").length;

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.delete(`/boards/${deleting.id}`);
      setDeleting(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center gap-6 border-b border-border bg-surface px-6">
        <Logo />
        <div className="relative mx-auto w-full max-w-md">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-placeholder" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar quadros"
            className="h-9 w-full rounded-lg bg-surface-alt pr-3 pl-9 text-sm text-ink placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-navy/15"
          />
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6 sm:p-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Meus quadros</h1>
            {boards && (
              <p className="mt-1 text-sm text-muted">
                {boards.length} {boards.length === 1 ? "quadro" : "quadros"} · você é
                administrador em {adminCount}
              </p>
            )}
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Novo quadro
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>
        )}

        {boards === null && !error && <p className="text-sm text-muted">Carregando quadros...</p>}

        {boards && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((b) => (
              <BoardCard
                key={b.id}
                board={b}
                onEdit={() => setEditing(b)}
                onDelete={() => setDeleting(b)}
              />
            ))}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted transition-colors hover:border-navy hover:text-navy"
            >
              <Plus size={16} /> Criar quadro
            </button>
          </div>
        )}
        {boards && boards.length > 0 && visible.length === 0 && (
          <p className="mt-6 text-sm text-muted">Nenhum quadro encontrado para “{query}”.</p>
        )}
      </main>

      {creating && (
        <NewBoardModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {editing && (
        <NewBoardModal
          board={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <Modal title="Excluir quadro" onClose={() => setDeleting(null)}>
          <div className="space-y-4 p-5">
            <p className="text-sm text-body">
              Excluir <strong className="text-ink">{deleting.name}</strong>? Todas as listas, cards,
              etiquetas e comentários serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Excluir quadro
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function BoardsPage() {
  return (
    <RequireAuth>
      <BoardsContent />
    </RequireAuth>
  );
}
