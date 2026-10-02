"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RouteGuards";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { BoardHeader } from "@/components/board/BoardHeader";
import { CardDetailModal } from "@/components/board/CardDetailModal";
import { DeleteListModal, type DeleteListChoice } from "@/components/board/DeleteListModal";
import { FilterBar } from "@/components/board/FilterBar";
import { LabelsModal } from "@/components/board/LabelsModal";
import { ListFormModal } from "@/components/board/ListFormModal";
import { MembersModal } from "@/components/board/MembersModal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBoard } from "@/hooks/useBoard";
import { api, getApiError, getErrorMessage } from "@/lib/api";
import { getDueStatus } from "@/lib/dates";
import type { BoardList, CardSummary } from "@/lib/types";

/** Cards without due date go last; ties keep the list order. */
function sortByDueDate(cards: CardSummary[]) {
  return [...cards].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return a.position - b.position;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

function BoardScreen({ boardId }: { boardId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { data, setData, error, reload } = useBoard(boardId);

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [sortByDue, setSortByDue] = useState(false);
  const [boardFormOpen, setBoardFormOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [listForm, setListForm] = useState<{ open: boolean; list: BoardList | null }>({
    open: false,
    list: null,
  });
  const [deletingList, setDeletingList] = useState<BoardList | null>(null);

  const openCardId = searchParams.get("card");
  const setOpenCard = useCallback(
    (cardId: string | null) => {
      const url = cardId ? `/boards/${boardId}?card=${cardId}` : `/boards/${boardId}`;
      router.replace(url, { scroll: false });
    },
    [boardId, router],
  );

  const labelsById = useMemo(
    () => new Map((data?.labels ?? []).map((label) => [label.id, label])),
    [data?.labels],
  );
  const membersById = useMemo(
    () => new Map((data?.members ?? []).map((member) => [member.userId, member])),
    [data?.members],
  );
  const allCards = useMemo(() => data?.lists.flatMap((list) => list.cards) ?? [], [data]);
  const labelUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const card of allCards) {
      for (const id of card.labelIds) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
    return usage;
  }, [allCards]);
  const overdueCount = allCards.filter(
    (card) => getDueStatus(card.dueDate, card.completed) === "overdue",
  ).length;

  const filterCards = useCallback(
    (cards: CardSummary[]) => {
      let result = cards;
      if (selectedLabelIds.length > 0) {
        result = result.filter((card) =>
          card.labelIds.some((id) => selectedLabelIds.includes(id)),
        );
      }
      if (onlyOverdue) {
        result = result.filter(
          (card) => getDueStatus(card.dueDate, card.completed) === "overdue",
        );
      }
      return sortByDue ? sortByDueDate(result) : result;
    },
    [selectedLabelIds, onlyOverdue, sortByDue],
  );

  const visibleCount = useMemo(
    () => data?.lists.reduce((sum, list) => sum + filterCards(list.cards).length, 0) ?? 0,
    [data, filterCards],
  );

  // Drag and drop works on the real order, so it is off while the view is
  // filtered or sorted; cards can still be moved from the card modal.
  const dragEnabled = selectedLabelIds.length === 0 && !onlyOverdue && !sortByDue;

  const setLists = useCallback(
    (updater: (lists: BoardList[]) => BoardList[]) =>
      setData((current) => (current ? { ...current, lists: updater(current.lists) } : current)),
    [setData],
  );

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-[18px] font-semibold text-ink">
          {error.status === 404 ? "Quadro não encontrado" : "Não foi possível carregar o quadro"}
        </p>
        <p className="max-w-md text-[15px] text-muted">
          {error.status === 404
            ? "Ele pode ter sido excluído ou você não é membro dele."
            : error.message}
        </p>
        <Link href="/boards" className="font-semibold text-navy hover:underline">
          Voltar para meus quadros
        </Link>
      </div>
    );
  }

  if (!data) return <Spinner label="Carregando quadro..." />;

  const isAdmin = data.role === "admin";

  async function handleCreateCard(listId: string, title: string) {
    try {
      await api.post(`/lists/${listId}/cards`, { title });
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  }

  async function handleMoveCard(cardId: string, listId: string, position: number) {
    try {
      await api.patch(`/cards/${cardId}/move`, { listId, position });
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível mover o card"));
    } finally {
      reload();
    }
  }

  async function handleReorderLists(listIds: string[]) {
    try {
      await api.put(`/boards/${boardId}/lists/order`, { listIds });
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível reordenar as listas"));
      reload();
    }
  }

  async function handleSaveList(values: { title: string; position: number }) {
    try {
      if (listForm.list) {
        await api.patch(`/lists/${listForm.list.id}`, values);
        toast.success("Lista atualizada");
      } else {
        await api.post(`/boards/${boardId}/lists`, values);
        toast.success("Lista criada");
      }
      setListForm({ open: false, list: null });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  }

  async function handleDeleteList(choice: DeleteListChoice) {
    if (!deletingList) return;
    const params: Record<string, string> = {};
    if (choice.cardsAction) params.cardsAction = choice.cardsAction;
    if (choice.cardsAction === "move") params.targetListId = choice.targetListId;
    try {
      await api.delete(`/lists/${deletingList.id}`, { params });
      toast.success(
        choice.cardsAction === "move"
          ? "Lista excluída e cards movidos"
          : "Lista excluída",
      );
      setDeletingList(null);
      reload();
    } catch (err) {
      const apiError = getApiError(err);
      toast.error(apiError.message ?? "Não foi possível excluir a lista");
      // Someone may have added cards meanwhile: refresh so the modal shows them.
      if (apiError.code === "LIST_HAS_CARDS" || apiError.code === "LIST_DELETION_BLOCKED") {
        reload();
      }
      throw err;
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BoardHeader
        data={data}
        onEditBoard={() => setBoardFormOpen(true)}
        onOpenLabels={() => setLabelsOpen(true)}
        onOpenMembers={() => setMembersOpen(true)}
      />
      <FilterBar
        labels={data.labels}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={(labelId) =>
          setSelectedLabelIds((current) =>
            current.includes(labelId)
              ? current.filter((id) => id !== labelId)
              : [...current, labelId],
          )
        }
        onClearLabels={() => setSelectedLabelIds([])}
        onlyOverdue={onlyOverdue}
        onToggleOverdue={() => setOnlyOverdue((value) => !value)}
        totalCards={allCards.length}
        visibleCards={visibleCount}
        overdueCount={overdueCount}
        sortByDue={sortByDue}
        onToggleSort={() => setSortByDue((value) => !value)}
      />
      {!dragEnabled && (
        <p className="border-b border-border bg-amber-bg px-[30px] py-1.5 text-[13px] text-amber-text">
          Arrastar está desativado enquanto há filtros ou ordenação por prazo. Use o
          campo “Lista” do card para movê-lo.
        </p>
      )}

      <main className="min-h-0 flex-1">
        <BoardCanvas
          lists={data.lists}
          setLists={setLists}
          labelsById={labelsById}
          membersById={membersById}
          canManageLists={isAdmin}
          dragEnabled={dragEnabled}
          filterCards={filterCards}
          onOpenCard={setOpenCard}
          onEditList={(list) => setListForm({ open: true, list })}
          onDeleteList={setDeletingList}
          onAddList={() => setListForm({ open: true, list: null })}
          onCreateCard={handleCreateCard}
          onMoveCard={handleMoveCard}
          onReorderLists={handleReorderLists}
        />
      </main>

      <CardDetailModal
        cardId={openCardId}
        board={data}
        labelUsage={labelUsage}
        onClose={() => setOpenCard(null)}
        onBoardChange={reload}
      />

      <BoardFormModal
        open={boardFormOpen}
        board={data.board}
        onClose={() => setBoardFormOpen(false)}
        onSaved={() => {
          setBoardFormOpen(false);
          reload();
        }}
      />

      <LabelsModal
        open={labelsOpen}
        boardId={boardId}
        labels={data.labels}
        usage={labelUsage}
        isAdmin={isAdmin}
        onClose={() => setLabelsOpen(false)}
        onChanged={() => {
          reload();
          setSelectedLabelIds((current) =>
            current.filter((id) => labelsById.has(id)),
          );
        }}
      />

      <MembersModal
        open={membersOpen}
        boardId={boardId}
        members={data.members}
        isAdmin={isAdmin}
        onClose={() => setMembersOpen(false)}
        onChanged={reload}
        onLeft={() => router.replace("/boards")}
      />

      <ListFormModal
        open={listForm.open}
        list={listForm.list}
        lists={data.lists}
        onClose={() => setListForm({ open: false, list: null })}
        onSubmit={handleSaveList}
      />

      <DeleteListModal
        open={Boolean(deletingList)}
        list={deletingList ? (data.lists.find((list) => list.id === deletingList.id) ?? deletingList) : null}
        lists={data.lists}
        blockWithCards={data.board.blockListDeletionWithCards}
        onClose={() => setDeletingList(null)}
        onConfirm={handleDeleteList}
      />
    </div>
  );
}

function BoardRoute() {
  const params = useParams<{ boardId: string }>();
  return <BoardScreen key={params.boardId} boardId={params.boardId} />;
}

export default function BoardPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Spinner />}>
        <BoardRoute />
      </Suspense>
    </RequireAuth>
  );
}
