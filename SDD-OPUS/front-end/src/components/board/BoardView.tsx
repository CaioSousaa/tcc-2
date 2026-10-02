"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { CardModal } from "@/components/card/CardModal";
import { MembersDialog } from "@/components/members/MembersDialog";
import { RoleBadge } from "@/components/RoleBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage, parseApiError } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useBoard, useMoveCard, useMoveList } from "@/lib/board";
import { cardMoveBetween, locateCard, moveCardToList, reorderCardInList, reorderLists } from "@/lib/boardOrdering";
import { countOverdue } from "@/lib/dates";
import { cardMatchesFilter, EMPTY_FILTER, isFilterActive, pruneFilter, type CardFilter } from "@/lib/filters";
import { useToday } from "@/lib/hooks/useToday";
import { queryKeys } from "@/lib/queryKeys";
import type { BoardDetail, BoardList, CardSummary } from "@/lib/types";
import { AddListForm } from "./AddListForm";
import { CardView } from "./CardView";
import { FilterBar } from "./FilterBar";
import { LabelsManagerDialog } from "./LabelsManagerDialog";
import { ListColumn, listSortableId } from "./ListColumn";

const LIST_PREFIX = "list:";

export function BoardView({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);

  if (board.isPending) return <Spinner label="Carregando quadro…" />;

  if (board.isError) {
    const info = parseApiError(board.error);
    if (info.status === 404) {
      // CA-Q3 / B12 / B36: not a member, deleted, or malformed id all look the same.
      return (
        <main className="mx-auto max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Quadro não encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ele pode ter sido excluído ou você não tem mais acesso a ele.
          </p>
          <Link href="/boards" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Voltar para meus quadros
          </Link>
        </main>
      );
    }
    return (
      <main className="mx-auto max-w-md space-y-3 p-8">
        <Alert>{info.message}</Alert>
        <Button variant="secondary" onClick={() => board.refetch()}>
          Tentar novamente
        </Button>
      </main>
    );
  }

  return <BoardContent boardId={boardId} board={board.data} />;
}

function BoardContent({ boardId, board }: { boardId: string; board: BoardDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const me = useMe();
  const today = useToday();

  const moveCard = useMoveCard(boardId);
  const moveList = useMoveList(boardId);

  const canEdit = board.role !== "observer";
  const isAdmin = board.role === "admin";

  const [filter, setFilter] = useState<CardFilter>(EMPTY_FILTER);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);

  // Drag state: while dragging, `dragLists` mirrors the lists with the preview applied.
  const [dragLists, setDragLists] = useState<BoardList[] | null>(null);
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const dragOrigin = useRef<BoardList[] | null>(null);

  const lists = dragLists ?? board.lists;
  const listsRef = useRef(lists);
  useEffect(() => {
    listsRef.current = lists;
  });

  const labelsById = useMemo(() => new Map(board.labels.map((label) => [label.id, label])), [board.labels]);
  const membersById = useMemo(() => new Map(board.members.map((m) => [m.userId, m])), [board.members]);

  // B30: a label deleted meanwhile stops counting in the filter.
  const effectiveFilter = useMemo(
    () => pruneFilter(filter, new Set(board.labels.map((label) => label.id))),
    [filter, board.labels],
  );
  const filterActive = isFilterActive(effectiveFilter);

  const allCards = useMemo(() => lists.flatMap((list) => list.cards), [lists]);
  const overdueCount = countOverdue(allCards, today);

  const openCardId = searchParams.get("card");
  const openCard = useCallback(
    (cardId: string) => router.push(`${pathname}?card=${cardId}`, { scroll: false }),
    [router, pathname],
  );
  const closeCard = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space picks up / drops; Enter is left to "open card".
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  // Lists: closest list. Cards: the card under the pointer, or the nearest card of the list
  // under the pointer, or that (possibly empty) list itself.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === "list") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "list"),
      });
    }

    const pointer = pointerWithin(args);
    const hits = pointer.length > 0 ? pointer : rectIntersection(args);
    const overId = getFirstCollision(hits, "id");
    if (overId === null || overId === undefined) return [];

    const overKey = String(overId);
    if (overKey.startsWith(LIST_PREFIX)) {
      const list = listsRef.current.find((l) => l.id === overKey.slice(LIST_PREFIX.length));
      const cardIds = new Set((list?.cards ?? []).map((card) => card.id));
      if (cardIds.size > 0) {
        const nearest = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) => cardIds.has(String(c.id))),
        });
        if (nearest.length > 0) return nearest;
      }
    }
    return [{ id: overId }];
  }, []);

  function onDragStart(event: DragStartEvent) {
    setNotice(null);
    dragOrigin.current = board.lists;
    setDragLists(board.lists);
    if (event.active.data.current?.type === "card") {
      const location = locateCard(board.lists, String(event.active.id));
      const card = location && board.lists.find((l) => l.id === location.listId)?.cards[location.position];
      setActiveCard(card ?? null);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "card") return;

    const current = dragLists ?? board.lists;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = locateCard(current, activeId);
    if (!from) return;

    let toListId: string;
    let overCardId: string | null = null;
    if (overId.startsWith(LIST_PREFIX)) {
      toListId = overId.slice(LIST_PREFIX.length);
    } else {
      const target = locateCard(current, overId);
      if (!target) return;
      toListId = target.listId;
      overCardId = overId;
    }
    if (toListId === from.listId) return; // same list: reordered on drop

    const translated = active.rect.current.translated;
    const below = overCardId !== null && translated !== null && translated.top > over.rect.top + over.rect.height / 2;
    setDragLists(moveCardToList(current, activeId, toListId, overCardId, below));
  }

  function commitLists(next: BoardList[]) {
    queryClient.setQueryData<BoardDetail>(queryKeys.board(boardId), (old) => (old ? { ...old, lists: next } : old));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const origin = dragOrigin.current ?? board.lists;
    const current = dragLists ?? origin;
    setDragLists(null);
    setActiveCard(null);
    dragOrigin.current = null;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (active.data.current?.type === "list") {
      if (!overId.startsWith(LIST_PREFIX) || !activeId.startsWith(LIST_PREFIX)) return;
      const listId = activeId.slice(LIST_PREFIX.length);
      const reordered = reorderLists(origin, listId, overId.slice(LIST_PREFIX.length));
      const position = reordered.findIndex((l) => l.id === listId);
      if (position === origin.findIndex((l) => l.id === listId)) return;

      commitLists(reordered); // optimistic; the mutation settles with a refetch (R-34)
      moveList.mutate(
        { listId, position },
        { onError: (error) => setNotice({ tone: "error", text: errorMessage(error) }) },
      );
      return;
    }

    let next = current;
    if (!overId.startsWith(LIST_PREFIX)) {
      const from = locateCard(next, activeId);
      const to = locateCard(next, overId);
      if (from && to && from.listId === to.listId) next = reorderCardInList(next, from.listId, activeId, overId);
    }

    const target = cardMoveBetween(origin, next, activeId);
    if (!target) return; // dropped where it started (B18)

    commitLists(next);
    moveCard.mutate(
      { cardId: activeId, listId: target.listId, position: target.position },
      { onError: (error) => setNotice({ tone: "error", text: errorMessage(error) }) },
    );
  }

  function onDragCancel() {
    setDragLists(null);
    setActiveCard(null);
    dragOrigin.current = null;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col">
      <div className="space-y-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/boards" className="text-sm text-slate-500 hover:text-slate-800" aria-label="Voltar para meus quadros">
            ←
          </Link>
          <h1 className="min-w-0 truncate text-lg font-semibold text-slate-900">{board.name}</h1>
          <RoleBadge role={board.role} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMembersOpen(true)}>
              Membros ({board.members.length})
            </Button>
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => setLabelsOpen(true)}>
                Etiquetas
              </Button>
            )}
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => setEditingBoard(true)}>
                Editar quadro
              </Button>
            )}
          </div>
        </div>
        {board.description && <p className="max-w-3xl text-sm text-slate-600">{board.description}</p>}
        <FilterBar labels={board.labels} filter={effectiveFilter} onChange={setFilter} overdueCount={overdueCount} />
        {filterActive && (
          <Alert tone="info">
            Filtro ativo: apenas os cards correspondentes estão visíveis. Este filtro vale só para você.
          </Alert>
        )}
        {notice && (
          <Alert tone={notice.tone}>
            {notice.text}{" "}
            <button type="button" className="font-medium underline" onClick={() => setNotice(null)}>
              Dispensar
            </button>
          </Alert>
        )}
        {!canEdit && (
          <p className="text-xs text-slate-500">Você é Observador neste quadro: pode visualizar, mas não editar.</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full items-start gap-3 p-4">
            <SortableContext items={lists.map((l) => listSortableId(l.id))} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  boardId={boardId}
                  list={list}
                  visibleCards={list.cards.filter((card) => cardMatchesFilter(card, effectiveFilter, today))}
                  filterActive={filterActive}
                  labelsById={labelsById}
                  membersById={membersById}
                  today={today}
                  canEdit={canEdit}
                  onOpenCard={openCard}
                  onCardCreated={() => {
                    if (filterActive) {
                      setNotice({
                        tone: "info",
                        text: "Card criado. Como há um filtro ativo, ele pode estar oculto até você limpar o filtro.",
                      });
                    }
                  }}
                />
              ))}
            </SortableContext>

            {lists.length === 0 && !canEdit && (
              <p className="p-4 text-sm text-slate-500">Este quadro ainda não tem listas.</p>
            )}
            {canEdit && <AddListForm boardId={boardId} />}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-72 rotate-2 cursor-grabbing opacity-95">
              <CardView card={activeCard} labelsById={labelsById} membersById={membersById} today={today} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {lists.length === 0 && canEdit && (
        <p className="px-4 pb-4 text-sm text-slate-500">
          Este quadro está vazio. Adicione a primeira lista para começar.
        </p>
      )}

      {openCardId && (
        <CardModal
          key={openCardId}
          board={board}
          cardId={openCardId}
          today={today}
          canEdit={canEdit}
          onClose={closeCard}
          onManageLabels={() => setLabelsOpen(true)}
        />
      )}

      <MembersDialog
        boardId={boardId}
        myRole={board.role}
        myUserId={me.data?.id ?? ""}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
      />
      {canEdit && (
        <LabelsManagerDialog boardId={boardId} labels={board.labels} open={labelsOpen} onClose={() => setLabelsOpen(false)} />
      )}
      <BoardFormModal
        open={editingBoard}
        board={{ id: board.id, name: board.name, description: board.description }}
        onClose={() => setEditingBoard(false)}
      />
    </div>
  );
}
