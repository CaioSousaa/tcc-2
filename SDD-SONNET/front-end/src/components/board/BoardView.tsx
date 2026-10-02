"use client";

import { ChevronLeft, Pencil, Tag, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLocal } from "@/lib/date";
import { EMPTY_FILTERS, countCards, isFilterActive, pruneFilters, type BoardFilters } from "@/lib/filters";
import { can } from "@/lib/permissions";
import { useBoard } from "@/lib/use-board";
import { BoardFormDialog, type BoardFormValue } from "@/components/boards/BoardFormDialog";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button, IconButton, Spinner } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { BoardCanvas } from "./BoardCanvas";
import { BoardContext } from "./BoardContext";
import { BoardFiltersBar } from "./BoardFilters";
import { CardDetailDialog } from "./CardDetailDialog";
import { LabelsDialog } from "./LabelsDialog";
import { MembersDialog } from "./MembersDialog";

export function BoardView({ boardId }: { boardId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const cardId = searchParams.get("card");
  const openCard = useCallback(
    (id: string | null) => {
      router.replace(id ? `${pathname}?card=${encodeURIComponent(id)}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  const { data, setData, error, reload } = useBoard(boardId, (message) => toast(message, "error"));
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [sortByDue, setSortByDue] = useState(false);

  const labelIds = data?.labels.map((label) => label.id);
  const activeFilters = useMemo(
    () => (labelIds ? pruneFilters(filters, labelIds) : filters),
    [filters, labelIds],
  );
  const today = todayLocal();

  if (!data) {
    return error ? (
      <main className="mx-auto w-full max-w-xl p-6">
        <EmptyState
          title="Não foi possível carregar o quadro"
          description={error.message}
          action={<Button onClick={reload}>Tentar de novo</Button>}
        />
      </main>
    ) : (
      <div className="flex flex-1 items-center justify-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const { board } = data;
  const role = board.myRole;
  const totalCards = countCards(data.lists);

  async function updateBoard(value: BoardFormValue) {
    await api.patch(`/boards/${boardId}`, { name: value.name, color: value.color });
    await reload();
  }

  async function deleteBoard() {
    try {
      await api.delete(`/boards/${boardId}`);
      router.replace("/");
    } catch (cause) {
      toast(toApiError(cause).message, "error");
      setDeleting(false);
      await reload();
    }
  }

  return (
    <div className="flex h-screen min-h-0 flex-1 flex-col">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 text-base text-muted hover:text-ink">
            <ChevronLeft size={15} aria-hidden />
            Quadros
          </Link>
          <span className="h-6 w-px bg-border" aria-hidden />
          <div className="flex min-w-0 items-center gap-4">
            <h1 className="truncate text-[19px] font-bold tracking-[-0.2px] text-ink">{board.name}</h1>
            {can(role, "board.update") ? (
              <span className="flex gap-1.5">
                <IconButton icon={Pencil} label="Editar quadro" size={32} onClick={() => setEditing(true)} />
                <IconButton icon={Trash2} label="Excluir quadro" size={32} onClick={() => setDeleting(true)} />
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <Button variant="secondary" icon={Tag} className="px-[18px] text-[15.5px]" onClick={() => setLabelsOpen(true)}>
            Etiquetas
          </Button>
          <Button variant="secondary" icon={Users} className="px-[18px] text-[15.5px]" onClick={() => setMembersOpen(true)}>
            Membros
          </Button>
          <AvatarStack
            size={32}
            people={data.members.map((member) => ({ id: member.userId, name: member.name }))}
          />
        </div>
      </header>

      <BoardFiltersBar
        labels={data.labels}
        filters={activeFilters}
        onChange={setFilters}
        cardCount={totalCards}
        sortByDue={sortByDue}
        onToggleSort={() => setSortByDue((value) => !value)}
      />

      <BoardContext.Provider
        value={{
          boardId,
          data,
          setData,
          reload,
          role,
          openCard,
          filters: activeFilters,
          today,
          sortByDue,
          dragDisabled: isFilterActive(activeFilters) || sortByDue,
        }}
      >
        <main className="min-h-0 flex-1 overflow-auto pl-[30px] pt-[30px]">
          <BoardCanvas />
        </main>
        <CardDetailDialog cardId={cardId} />
        <LabelsDialog open={labelsOpen} onClose={() => setLabelsOpen(false)} />
        <MembersDialog
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          myUserId={user.id}
          onLeft={() => {
            setMembersOpen(false);
            toast("Você saiu do quadro.", "success");
            router.replace("/");
          }}
        />
      </BoardContext.Provider>

      <BoardFormDialog
        open={editing}
        mode="edit"
        initial={{ name: board.name, color: board.color }}
        onSubmit={updateBoard}
        onClose={() => setEditing(false)}
      />
      <ConfirmDialog
        open={deleting}
        title={`Excluir o quadro “${board.name}”?`}
        confirmLabel="Excluir quadro"
        onConfirm={deleteBoard}
        onClose={() => setDeleting(false)}
      >
        <p>
          Todas as listas, cards, checklists, etiquetas e comentários serão removidos
          definitivamente e os membros perderão o acesso. Esta ação não pode ser desfeita.
        </p>
      </ConfirmDialog>
    </div>
  );
}
