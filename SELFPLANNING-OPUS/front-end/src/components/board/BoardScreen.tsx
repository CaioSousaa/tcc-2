"use client";

import { AxiosError } from "axios";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { FormError } from "@/components/ui/Field";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { api, errorMessage } from "@/lib/api";
import type { BoardDetail, BoardListData, CardSummary } from "@/lib/types";
import { BoardHeader } from "./BoardHeader";
import { CardDetailModal } from "./CardDetailModal";
import { DeleteListModal } from "./DeleteListModal";
import { dropIndex, isDragOf, LIST_MIME } from "./dnd";
import { FilterBar, type BoardFilters } from "./FilterBar";
import { LabelsModal } from "./LabelsModal";
import { ListColumn } from "./ListColumn";
import { ListModal } from "./ListModal";
import { MembersModal } from "./MembersModal";

type ModalState =
  | { type: "board-edit" }
  | { type: "list-create" }
  | { type: "list-edit"; list: BoardListData }
  | { type: "list-delete"; list: BoardListData }
  | { type: "labels" }
  | { type: "members" }
  | null;

type DragState = { type: "card"; cardId: string; fromListId: string } | { type: "list"; listId: string } | null;

/** Remove o item de `from` e o insere em `to` (índice já relativo ao array sem o item) */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function BoardScreen({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loadError, setLoadError] = useState<{ message: string; fatal: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>({ labelIds: [], overdue: false });
  const [modal, setModal] = useState<ModalState>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [cardDrop, setCardDrop] = useState<{ listId: string; index: number } | null>(null);
  const [listDropIndex, setListDropIndex] = useState<number | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const { data } = await api.get<BoardDetail>(`/boards/${boardId}`, {
        params: {
          labels: filters.labelIds.length > 0 ? filters.labelIds.join(",") : undefined,
          overdue: filters.overdue ? "true" : undefined,
        },
      });
      // Ignora respostas antigas quando os filtros mudam rapidamente
      if (id !== requestId.current) return;
      setBoard(data);
      setLoadError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      setLoadError({
        message: errorMessage(err, "Não foi possível carregar o quadro."),
        fatal: status === 404 || status === 403,
      });
    }
  }, [boardId, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const resetDrag = () => {
    setDrag(null);
    setCardDrop(null);
    setListDropIndex(null);
  };

  async function mutate(optimistic: (current: BoardDetail) => BoardDetail, request: () => Promise<unknown>) {
    setActionError(null);
    setBoard((current) => (current ? optimistic(current) : current));
    try {
      await request();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      await load();
    }
  }

  function moveCard(cardId: string, fromListId: string, toListId: string, slot: number) {
    if (!board) return;
    const source = board.lists.find((l) => l.id === fromListId);
    const fromIndex = source?.cards.findIndex((c) => c.id === cardId) ?? -1;
    if (!source || fromIndex === -1) return;

    // `slot` conta o próprio card quando ele está na mesma lista
    let position = slot;
    if (fromListId === toListId) {
      if (slot > fromIndex) position = slot - 1;
      if (position === fromIndex) return;
    }

    const card = source.cards[fromIndex];
    mutate(
      (current) => ({
        ...current,
        lists: current.lists.map((list) => {
          let cards = list.cards;
          let cardCount = list.cardCount;
          if (list.id === fromListId) {
            cards = cards.filter((c) => c.id !== cardId);
            cardCount -= 1;
          }
          if (list.id === toListId) {
            cards = [...cards];
            cards.splice(position, 0, { ...card, listId: toListId });
            cardCount += 1;
          }
          return { ...list, cards, cardCount };
        }),
      }),
      () => api.patch(`/boards/${boardId}/cards/${cardId}/move`, { listId: toListId, position }),
    );
  }

  function moveList(listId: string, slot: number) {
    if (!board) return;
    const fromIndex = board.lists.findIndex((l) => l.id === listId);
    const toIndex = slot > fromIndex ? slot - 1 : slot;
    if (fromIndex === -1 || toIndex === fromIndex) return;

    const lists = moveItem(board.lists, fromIndex, toIndex);
    mutate(
      (current) => ({ ...current, lists }),
      () => api.put(`/boards/${boardId}/lists/order`, { listIds: lists.map((l) => l.id) }),
    );
  }

  async function addCard(listId: string, title: string) {
    setActionError(null);
    try {
      await api.post(`/boards/${boardId}/lists/${listId}/cards`, { title });
    } catch (err) {
      setActionError(errorMessage(err));
    }
    await load();
  }

  function handleBoardDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!isDragOf(event, LIST_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setListDropIndex(dropIndex(event.currentTarget, "[data-list-id]", event.clientX, "x"));
  }

  function handleBoardDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!isDragOf(event, LIST_MIME) || drag?.type !== "list") return;
    event.preventDefault();
    moveList(drag.listId, dropIndex(event.currentTarget, "[data-list-id]", event.clientX, "x"));
    resetDrag();
  }

  if (loadError?.fatal) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <p className="text-[17px] text-body">{loadError.message}</p>
        <Link href="/boards" className="text-[15px] font-semibold text-navy hover:underline">
          Voltar para meus quadros
        </Link>
      </div>
    );
  }

  if (!board || !user) {
    return loadError ? (
      <div className="mx-auto w-full max-w-xl py-24">
        <FormError message={loadError.message} />
      </div>
    ) : (
      <LoadingScreen message="Carregando quadro…" />
    );
  }

  const canEdit = board.role !== "viewer";
  const filtersActive = filters.labelIds.length > 0 || filters.overdue;
  const listDropIndicator = <div className="w-[3px] shrink-0 self-stretch rounded-full bg-navy" />;

  return (
    <div className="flex h-screen flex-col">
      <BoardHeader
        board={board}
        onEditBoard={() => setModal({ type: "board-edit" })}
        onOpenLabels={() => setModal({ type: "labels" })}
        onOpenMembers={() => setModal({ type: "members" })}
      />
      <FilterBar board={board} filters={filters} onChange={setFilters} />

      {(actionError || (filtersActive && canEdit)) && (
        <div className="flex flex-col gap-2 px-[30px] pt-4">
          <FormError message={actionError} />
          {filtersActive && canEdit && (
            <p className="text-[13.5px] text-muted">
              Com filtros ativos, arrastar cards fica desabilitado. Limpe os filtros para reordenar.
            </p>
          )}
        </div>
      )}

      <div
        onDragOver={handleBoardDragOver}
        onDrop={handleBoardDrop}
        className="flex flex-1 items-start gap-[21px] overflow-x-auto px-[30px] pb-6 pt-[30px]"
      >
        {board.lists.map((list, index) => (
          <div key={list.id} className="flex max-h-full shrink-0 items-start gap-[21px] self-stretch">
            {drag?.type === "list" && listDropIndex === index && listDropIndicator}
            <ListColumn
              list={list}
              canEdit={canEdit}
              cardDragEnabled={!filtersActive}
              draggingCardId={drag?.type === "card" ? drag.cardId : null}
              cardDropIndex={drag?.type === "card" && cardDrop?.listId === list.id ? cardDrop.index : null}
              listDragging={drag?.type === "list" && drag.listId === list.id}
              onOpenCard={(card: CardSummary) => setOpenCardId(card.id)}
              onEdit={() => setModal({ type: "list-edit", list })}
              onDelete={() => setModal({ type: "list-delete", list })}
              onAddCard={(title) => addCard(list.id, title)}
              onCardDragStart={(card) => setDrag({ type: "card", cardId: card.id, fromListId: list.id })}
              onCardDragOver={(slot) => setCardDrop({ listId: list.id, index: slot })}
              onCardDrop={(slot) => {
                if (drag?.type === "card") moveCard(drag.cardId, drag.fromListId, list.id, slot);
                resetDrag();
              }}
              onListDragStart={() => setDrag({ type: "list", listId: list.id })}
              onDragEnd={resetDrag}
            />
          </div>
        ))}
        {drag?.type === "list" && listDropIndex === board.lists.length && listDropIndicator}

        {canEdit && (
          <button
            type="button"
            onClick={() => setModal({ type: "list-create" })}
            className="flex h-[60px] w-[351px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-border-strong text-base text-muted transition-colors hover:bg-white/60"
          >
            <Plus size={15} /> Adicionar lista
          </button>
        )}

        {board.lists.length === 0 && !canEdit && (
          <p className="text-[15px] text-muted">Este quadro ainda não tem listas.</p>
        )}
      </div>

      {modal?.type === "board-edit" && (
        <BoardFormModal board={board} onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.type === "list-create" && (
        <ListModal boardId={board.id} lists={board.lists} onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.type === "list-edit" && (
        <ListModal
          boardId={board.id}
          lists={board.lists}
          list={modal.list}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === "list-delete" && (
        <DeleteListModal
          boardId={board.id}
          list={modal.list}
          lists={board.lists}
          onClose={() => setModal(null)}
          onDeleted={load}
        />
      )}
      {modal?.type === "labels" && (
        <LabelsModal
          boardId={board.id}
          labels={board.labels}
          canEdit={canEdit}
          onChanged={load}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "members" && (
        <MembersModal
          boardId={board.id}
          members={board.members}
          currentUserId={user.id}
          isAdmin={board.role === "admin"}
          onChanged={load}
          onClose={() => setModal(null)}
        />
      )}
      {openCardId && (
        <CardDetailModal
          board={board}
          cardId={openCardId}
          currentUser={user}
          onChanged={load}
          onClose={() => setOpenCardId(null)}
        />
      )}
    </div>
  );
}
