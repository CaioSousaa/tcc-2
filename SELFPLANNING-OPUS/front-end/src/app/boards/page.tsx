"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { BoardTile } from "@/components/boards/BoardTile";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormError } from "@/components/ui/Field";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Logo } from "@/components/ui/Logo";
import { UserMenu } from "@/components/UserMenu";
import { api, errorMessage } from "@/lib/api";
import { plural } from "@/lib/format";
import type { BoardSummary } from "@/lib/types";

export default function BoardsPage() {
  return (
    <AuthGuard>
      <BoardsScreen />
    </AuthGuard>
  );
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; board: BoardSummary }
  | { type: "delete"; board: BoardSummary }
  | null;

function BoardsScreen() {
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BoardSummary[]>("/boards");
      setBoards(data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Não foi possível carregar seus quadros."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (boards ?? []).filter((board) => board.name.toLowerCase().includes(term));
  }, [boards, search]);

  const adminCount = boards?.filter((b) => b.role === "admin").length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[78px] items-center justify-between border-b border-border bg-white px-6 md:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <label className="hidden h-11 w-[325px] items-center gap-3 rounded-lg border border-border bg-surface-alt px-4 md:flex">
            <Search size={14} className="text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar quadros"
              className="w-full bg-transparent text-[15px] text-ink outline-none"
            />
          </label>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1322px] flex-col gap-9 px-6 pb-16 pt-[60px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-bold text-ink">Meus quadros</h1>
            {boards && (
              <p className="text-[17px] text-muted">
                {plural(boards.length, "quadro", "quadros")} · você é administrador em {adminCount}
              </p>
            )}
          </div>
          <Button onClick={() => setModal({ type: "create" })} className="h-[47px] px-[22px] text-[15px]">
            <Plus size={15} /> Novo quadro
          </Button>
        </div>

        <FormError message={error} />

        {!boards && !error && <LoadingScreen message="Carregando quadros…" />}

        {boards && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((board) => (
              <BoardTile
                key={board.id}
                board={board}
                onEdit={() => setModal({ type: "edit", board })}
                onDelete={() => setModal({ type: "delete", board })}
              />
            ))}
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              className="flex h-[171px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-base text-muted transition-colors hover:bg-white/60"
            >
              <Plus size={18} />
              Criar quadro
            </button>
          </div>
        )}

        {boards && search && visible.length === 0 && (
          <p className="text-[15px] text-muted">Nenhum quadro encontrado para “{search}”.</p>
        )}
      </main>

      {modal?.type === "create" && <BoardFormModal onClose={() => setModal(null)} onSaved={load} />}
      {modal?.type === "edit" && (
        <BoardFormModal board={modal.board} onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title={`Excluir o quadro “${modal.board.name}”?`}
          description={`Ação irreversível: ${plural(modal.board.listCount, "lista", "listas")}, ${plural(
            modal.board.cardCount,
            "card",
            "cards",
          )}, checklists, etiquetas e comentários serão apagados.`}
          confirmLabel="Excluir quadro"
          onConfirm={async () => {
            await api.delete(`/boards/${modal.board.id}`);
            await load();
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
