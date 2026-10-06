"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardCard } from "@/components/boards/BoardCard";
import { NewBoardModal } from "@/components/boards/NewBoardModal";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Modal, ModalFooter } from "@/components/ui/Modal";
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
      <header className="flex h-[78px] items-center justify-between gap-4 border-b border-border bg-surface px-6 sm:px-10">
        <Logo />
        <div className="flex items-center gap-[17px]">
          <div className="relative hidden w-[325px] sm:block">
            <Search size={14} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar quadros e cards"
              className="h-11 w-full rounded-lg border border-border bg-surface-alt pr-4 pl-[42px] text-[15px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15"
            />
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1322px] flex-1 flex-col gap-9 px-6 pt-[60px] pb-12">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-bold tracking-[-0.8px] text-ink">Meus quadros</h1>
            {boards && (
              <p className="text-[17px] text-muted">
                {boards.length} {boards.length === 1 ? "quadro" : "quadros"} · você é
                administrador em {adminCount}
              </p>
            )}
          </div>
          <Button className="h-[47px] gap-2.5 px-[22px]" onClick={() => setCreating(true)}>
            <Plus size={15} /> Novo quadro
          </Button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>
        )}

        {boards === null && !error && <p className="text-sm text-muted">Carregando quadros...</p>}

        {boards && (
          <div className="grid gap-x-6 gap-y-[22px] sm:grid-cols-2 lg:grid-cols-4">
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
              className="flex min-h-[187px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#C5CAD3] text-base text-muted transition-colors hover:border-navy hover:text-navy"
            >
              <Plus size={18} /> Criar quadro
            </button>
          </div>
        )}
        {boards && boards.length > 0 && visible.length === 0 && (
          <p className="text-sm text-muted">Nenhum quadro encontrado para “{query}”.</p>
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
          <p className="text-[15px] leading-[23px] text-muted">
            Excluir <strong className="font-semibold text-ink">{deleting.name}</strong>? Todas as
            listas, cards, etiquetas e comentários serão removidos. Esta ação não pode ser
            desfeita.
          </p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Excluir quadro
            </Button>
          </ModalFooter>
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
