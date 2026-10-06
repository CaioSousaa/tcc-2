"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, getApiError, getErrorMessage } from "@/lib/api";
import { isOverdue } from "@/lib/dates";
import type { BoardDetail, BoardList, CardSummary } from "@/lib/types";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { BoardHeader } from "./BoardHeader";
import { CardDetailModal } from "./CardDetailModal";
import { CardView } from "./CardItem";
import { DeleteListModal } from "./DeleteListModal";
import { FilterBar } from "./FilterBar";
import { LabelsModal } from "./LabelsModal";
import { ListColumn, listDndId } from "./ListColumn";
import { ListFormModal } from "./ListFormModal";
import { MembersModal } from "./MembersModal";

type Columns = Record<string, CardSummary[]>;

const LIST_PREFIX = "list-";

function columnsFrom(board: BoardDetail): Columns {
  return Object.fromEntries(board.lists.map((list) => [list.id, list.cards]));
}

function compareByDue(a: CardSummary, b: CardSummary) {
  if (!a.dueDate && !b.dueDate) return a.position - b.position;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  return diff !== 0 ? diff : a.position - b.position;
}

export function BoardView({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Estado local usado na renderização (permite atualizações otimistas no arraste)
  const [columns, setColumns] = useState<Columns>({});
  const [listOrder, setListOrder] = useState<string[]>([]);
  const columnsRef = useRef<Columns>({});
  columnsRef.current = columns;

  // Filtros
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortByDue, setSortByDue] = useState(false);

  // Modais
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [listForm, setListForm] = useState<{ open: boolean; list: BoardList | null }>({ open: false, list: null });
  const [deletingList, setDeletingList] = useState<BoardList | null>(null);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [boardFormOpen, setBoardFormOpen] = useState(false);

  // Arraste
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const dragOrigin = useRef<{ listId: string; index: number } | null>(null);
  const dragging = Boolean(activeCard || activeListId);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ board: BoardDetail }>(`/boards/${boardId}`);
      setBoard(data.board);
      setLoadError(null);
    } catch (err) {
      const apiError = getApiError(err);
      setLoadError(
        apiError.status === 403 || apiError.status === 404
          ? apiError.message ?? "Quadro indisponível."
          : getErrorMessage(err, "Não foi possível carregar o quadro."),
      );
    }
  }, [boardId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!board || dragging) return;
    setColumns(columnsFrom(board));
    setListOrder(board.lists.map((l) => l.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Abre o card indicado na URL (#card-<id>), por exemplo vindo da busca.
  useEffect(() => {
    if (!board) return;
    const match = window.location.hash.match(/^#card-([0-9a-f-]{36})$/i);
    if (match) setOpenCardId(match[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id]);

  const openCard = useCallback((cardId: string) => {
    setOpenCardId(cardId);
    window.history.replaceState(null, "", `#card-${cardId}`);
  }, []);

  const closeCard = useCallback(() => {
    setOpenCardId(null);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const lists = useMemo(() => {
    if (!board) return [];
    const byId = new Map(board.lists.map((l) => [l.id, l]));
    return listOrder.map((id) => byId.get(id)).filter((l): l is BoardList => Boolean(l));
  }, [board, listOrder]);

  const allCards = useMemo(() => Object.values(columns).flat(), [columns]);
  const overdueCount = useMemo(() => allCards.filter(isOverdue).length, [allCards]);

  const filterActive = selectedLabelIds.length > 0 || overdueOnly;

  const visibleCards = useCallback(
    (cards: CardSummary[]) => {
      let result = cards.filter(
        (card) =>
          (selectedLabelIds.length === 0 || card.labels.some((l) => selectedLabelIds.includes(l.id))) &&
          (!overdueOnly || isOverdue(card)),
      );
      if (sortByDue) result = [...result].sort(compareByDue);
      return result;
    },
    [selectedLabelIds, overdueOnly, sortByDue],
  );

  const visibleCount = useMemo(
    () => Object.values(columns).reduce((sum, cards) => sum + visibleCards(cards).length, 0),
    [columns, visibleCards],
  );

  /* ----------------------------- Drag and drop ---------------------------- */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findListId = useCallback((id: string) => {
    if (id.startsWith(LIST_PREFIX)) return id.slice(LIST_PREFIX.length);
    return Object.keys(columnsRef.current).find((listId) =>
      columnsRef.current[listId].some((card) => card.id === id),
    );
  }, []);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === "list") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "list"),
      });
    }
    const hits = pointerWithin(args);
    const cardHits = hits.filter((hit) => !String(hit.id).startsWith(LIST_PREFIX));
    if (cardHits.length > 0) return cardHits;
    if (hits.length > 0) return hits;
    return closestCorners(args);
  }, []);

  function handleDragStart({ active }: DragStartEvent) {
    setActionError(null);
    if (active.data.current?.type === "list") {
      setActiveListId(String(active.id).slice(LIST_PREFIX.length));
      return;
    }
    const listId = findListId(String(active.id));
    if (!listId) return;
    const index = columnsRef.current[listId].findIndex((c) => c.id === active.id);
    dragOrigin.current = { listId, index };
    setActiveCard(columnsRef.current[listId][index]);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.data.current?.type !== "card") return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findListId(activeId);
    const to = findListId(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const card = prev[from].find((c) => c.id === activeId);
      if (!card) return prev;
      const target = prev[to];
      let index = overId.startsWith(LIST_PREFIX) ? target.length : target.findIndex((c) => c.id === overId);
      if (index < 0) index = target.length;
      const translated = active.rect.current.translated;
      if (!overId.startsWith(LIST_PREFIX) && translated && translated.top > over.rect.top + over.rect.height / 2) {
        index += 1;
      }
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== activeId),
        [to]: [...target.slice(0, index), { ...card, listId: to }, ...target.slice(index)],
      };
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    const activeId = String(active.id);

    if (active.data.current?.type === "list") {
      setActiveListId(null);
      if (!over || over.id === active.id) return;
      const from = listOrder.indexOf(activeId.slice(LIST_PREFIX.length));
      const to = listOrder.indexOf(findListId(String(over.id)) ?? "");
      if (from < 0 || to < 0) return;
      const nextOrder = arrayMove(listOrder, from, to);
      setListOrder(nextOrder);
      try {
        await api.put(`/boards/${boardId}/lists/order`, { listIds: nextOrder });
      } catch (err) {
        setActionError(getErrorMessage(err, "Não foi possível reordenar as listas."));
      }
      load();
      return;
    }

    const origin = dragOrigin.current;
    dragOrigin.current = null;
    setActiveCard(null);
    const listId = findListId(activeId);
    if (!origin || !listId) return;

    let cards = columnsRef.current[listId];
    const overId = over ? String(over.id) : null;
    if (overId && !overId.startsWith(LIST_PREFIX) && overId !== activeId && findListId(overId) === listId) {
      cards = arrayMove(
        cards,
        cards.findIndex((c) => c.id === activeId),
        cards.findIndex((c) => c.id === overId),
      );
      setColumns((prev) => ({ ...prev, [listId]: cards }));
    }

    const finalIndex = cards.findIndex((c) => c.id === activeId);
    if (origin.listId === listId && origin.index === finalIndex) return;

    try {
      await api.patch(`/cards/${activeId}/move`, { listId, position: finalIndex });
    } catch (err) {
      setActionError(getErrorMessage(err, "Não foi possível mover o card."));
    }
    load();
  }

  function handleDragCancel() {
    setActiveCard(null);
    setActiveListId(null);
    dragOrigin.current = null;
    if (board) {
      setColumns(columnsFrom(board));
      setListOrder(board.lists.map((l) => l.id));
    }
  }

  /* -------------------------------- Ações -------------------------------- */

  const addCard = useCallback(
    async (listId: string, title: string) => {
      try {
        await api.post(`/lists/${listId}/cards`, { title });
        await load();
      } catch (err) {
        setActionError(getErrorMessage(err, "Não foi possível criar o card."));
        throw err;
      }
    },
    [load],
  );

  if (loadError && !board) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg text-ink">{loadError}</p>
        <Link href="/boards" className="text-[15px] font-semibold text-navy hover:underline">
          Voltar para meus quadros
        </Link>
      </div>
    );
  }

  if (!board || !user) return <FullPageSpinner />;

  const isAdmin = board.role === "admin";
  const cardDragDisabled = filterActive || sortByDue;
  const activeList = activeListId ? lists.find((l) => l.id === activeListId) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-page">
      <BoardHeader
        board={board}
        onEditBoard={() => setBoardFormOpen(true)}
        onOpenLabels={() => setLabelsOpen(true)}
        onOpenMembers={() => setMembersOpen(true)}
      />
      <FilterBar
        labels={board.labels}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={(id) =>
          setSelectedLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        onClearLabels={() => setSelectedLabelIds([])}
        overdueOnly={overdueOnly}
        overdueCount={overdueCount}
        onToggleOverdue={() => setOverdueOnly((v) => !v)}
        visibleCount={visibleCount}
        totalCount={allCards.length}
        sortByDue={sortByDue}
        onToggleSort={() => setSortByDue((v) => !v)}
      />

      {(actionError || cardDragDisabled) && (
        <div className="flex shrink-0 items-center gap-3 px-[30px] pt-3 text-[13.5px]">
          {actionError && (
            <span className="flex items-center gap-3 rounded-lg bg-red-bg px-3 py-1.5 text-red-dark">
              {actionError}
              <button type="button" className="font-semibold" onClick={() => setActionError(null)}>
                ✕
              </button>
            </span>
          )}
          {cardDragDisabled && (
            <span className="text-muted">
              Arrastar cards fica desativado com filtros ou ordenação por prazo ativos. Use o campo “Lista” no
              card para movê-lo.
            </span>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <main className="board-scroll flex min-h-0 flex-1 items-start gap-[21px] overflow-x-auto px-[30px] pb-6 pt-[30px]">
          <SortableContext items={lists.map((l) => listDndId(l.id))} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => {
              const cards = columns[list.id] ?? [];
              return (
                <ListColumn
                  key={list.id}
                  list={list}
                  cards={visibleCards(cards)}
                  totalCards={cards.length}
                  isAdmin={isAdmin}
                  cardDragDisabled={cardDragDisabled}
                  listDragDisabled={!isAdmin}
                  onOpenCard={openCard}
                  onAddCard={addCard}
                  onEditList={(l) => setListForm({ open: true, list: l })}
                  onDeleteList={(l) => setDeletingList({ ...l, cards: columns[l.id] ?? l.cards })}
                />
              );
            })}
          </SortableContext>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setListForm({ open: true, list: null })}
              className="flex h-[60px] w-[340px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-dash text-base text-muted transition-colors hover:border-muted hover:bg-surface hover:text-ink"
            >
              <Plus className="size-[15px]" />
              Adicionar lista
            </button>
          )}

          {lists.length === 0 && !isAdmin && (
            <p className="text-[15px] text-muted">Este quadro ainda não tem listas. Peça a um administrador para criá-las.</p>
          )}
        </main>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[306px]">
              <CardView card={activeCard} overlay />
            </div>
          ) : activeList ? (
            <div className="w-[340px] rounded-[14px] border border-border bg-list p-4 shadow-[0_16px_32px_rgba(26,31,44,0.18)]">
              <span className="text-[17px] font-bold text-ink">{activeList.title}</span>
              <span className="ml-2 text-[13px] text-placeholder">{(columns[activeList.id] ?? []).length}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailModal
        cardId={openCardId}
        board={board}
        currentUser={user}
        onClose={closeCard}
        onChanged={load}
      />

      <ListFormModal
        open={listForm.open}
        boardId={board.id}
        lists={lists}
        list={listForm.list}
        onClose={() => setListForm({ open: false, list: null })}
        onSaved={() => {
          setListForm({ open: false, list: null });
          load();
        }}
      />

      <DeleteListModal
        open={Boolean(deletingList)}
        list={deletingList}
        lists={lists}
        blockNonEmpty={board.blockNonEmptyListDeletion}
        onClose={() => setDeletingList(null)}
        onDeleted={() => {
          setDeletingList(null);
          load();
        }}
      />

      <LabelsModal
        open={labelsOpen}
        boardId={board.id}
        labels={board.labels}
        isAdmin={isAdmin}
        onClose={() => setLabelsOpen(false)}
        onChanged={load}
      />

      <MembersModal
        open={membersOpen}
        board={board}
        currentUserId={user.id}
        onClose={() => setMembersOpen(false)}
        onChanged={load}
        onLeft={() => router.replace("/boards")}
      />

      <BoardFormModal
        open={boardFormOpen}
        board={board}
        onClose={() => setBoardFormOpen(false)}
        onSaved={() => {
          setBoardFormOpen(false);
          load();
        }}
      />

    </div>
  );
}
