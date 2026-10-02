"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { api, toApiError } from "@/lib/api";
import { applyFilters, countCards, isFilterActive, sortByDueDate } from "@/lib/filters";
import {
  findCard,
  indexOfCard,
  moveCardInState,
  moveListInState,
} from "@/lib/board-state";
import { can } from "@/lib/permissions";
import type { ListWithCards } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { AddCardForm } from "./AddCardForm";
import { updateBoard, useBoardContext } from "./BoardContext";
import { CardItem, CardPreview } from "./CardItem";
import { DeleteListDialog } from "./DeleteListDialog";
import { ListColumn } from "./ListColumn";
import { ListDialog } from "./ListDialog";

export function BoardCanvas() {
  const { data, setData, reload, role, filters, today, sortByDue } = useBoardContext();
  const toast = useToast();
  const canManageLists = can(role, "list.manage");
  const canManageCards = can(role, "card.manage");
  const [deleting, setDeleting] = useState<ListWithCards | null>(null);
  const [listDialog, setListDialog] = useState<{ list: ListWithCards | null } | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const snapshot = useRef<ListWithCards[] | null>(null);
  const filtersActive = isFilterActive(filters);
  const visibleLists = useMemo(() => {
    const filtered = applyFilters(data.lists, filters, today);
    return sortByDue ? sortByDueDate(filtered) : filtered;
  }, [data.lists, filters, today, sortByDue]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Movimento otimista de lista; desfaz e avisa se a API falhar (RT-19, CB-06). */
  async function moveList(listId: string, toIndex: number) {
    const before = data.lists;
    const from = before.findIndex((item) => item.id === listId);
    if (from < 0 || toIndex < 0 || toIndex >= before.length || from === toIndex) return;

    updateBoard(setData, (board) => ({
      ...board,
      lists: moveListInState(board.lists, listId, toIndex),
    }));
    try {
      await api.post(`/lists/${listId}/move`, { position: toIndex });
    } catch (cause) {
      updateBoard(setData, (board) => ({ ...board, lists: before }));
      toast(toApiError(cause).message, "error");
      await reload();
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "card") {
      snapshot.current = data.lists;
      setActiveCardId(String(event.active.id));
    }
  }

  /** Prévia do card passando para outra lista durante o arrasto. */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "card") return;

    const from = indexOfCard(data.lists, String(active.id));
    if (!from) return;

    let toListId: string;
    let toIndex: number;
    if (over.data.current?.type === "card") {
      const overLocation = indexOfCard(data.lists, String(over.id));
      if (!overLocation) return;
      toListId = overLocation.listId;
      toIndex = overLocation.index;
    } else {
      const list = data.lists.find((item) => item.id === over.id);
      if (!list) return;
      toListId = list.id;
      toIndex = list.cards.length;
    }
    if (from.listId === toListId) return;

    updateBoard(setData, (board) => ({
      ...board,
      lists: moveCardInState(board.lists, String(active.id), toListId, toIndex),
    }));
  }

  async function persistCardMove(cardId: string, before: ListWithCards[], lists: ListWithCards[]) {
    const origin = indexOfCard(before, cardId);
    const final = indexOfCard(lists, cardId);
    if (!final || (origin && origin.listId === final.listId && origin.index === final.index)) return;

    try {
      await api.post(`/cards/${cardId}/move`, { listId: final.listId, position: final.index });
    } catch (cause) {
      updateBoard(setData, (board) => ({ ...board, lists: before }));
      toast(toApiError(cause).message, "error");
      await reload();
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.data.current?.type === "card") {
      const cardId = String(active.id);
      const before = snapshot.current ?? data.lists;
      snapshot.current = null;
      setActiveCardId(null);

      let lists = data.lists;
      const location = indexOfCard(lists, cardId);
      if (over && location && over.data.current?.type === "card" && over.id !== active.id) {
        const overLocation = indexOfCard(lists, String(over.id));
        if (overLocation && overLocation.listId === location.listId) {
          lists = moveCardInState(lists, cardId, location.listId, overLocation.index);
          const next = lists;
          updateBoard(setData, (board) => ({ ...board, lists: next }));
        }
      }
      void persistCardMove(cardId, before, lists);
      return;
    }

    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "list") return;
    // Soltar sobre um card: considera a lista que o contém.
    const overListId =
      over.data.current?.type === "card"
        ? indexOfCard(data.lists, String(over.id))?.listId
        : String(over.id);
    const toIndex = data.lists.findIndex((item) => item.id === overListId);
    if (toIndex >= 0) void moveList(String(active.id), toIndex);
  }

  function handleDragCancel() {
    if (snapshot.current) {
      const before = snapshot.current;
      updateBoard(setData, (board) => ({ ...board, lists: before }));
    }
    snapshot.current = null;
    setActiveCardId(null);
  }

  const activeCard = activeCardId ? findCard(data.lists, activeCardId) : undefined;

  return (
    <>
      {data.lists.length === 0 && !canManageLists ? (
        <EmptyState
          title="Este quadro ainda não tem listas"
          description="Quem pode editar o quadro ainda não criou nenhuma lista."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={data.lists.map((item) => item.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full items-start gap-[21px]">
              {visibleLists.map((list, index) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  onEdit={() => setListDialog({ list: data.lists[index] })}
                  onDelete={() => setDeleting(data.lists[index])}
                >
                  <SortableContext
                    items={list.cards.map((card) => card.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="flex min-h-2 flex-col gap-3 overflow-y-auto">
                      {list.cards.map((card) => (
                        <CardItem key={card.id} card={card} />
                      ))}
                    </ul>
                  </SortableContext>
                  {list.cards.length === 0 ? (
                    <p className="text-[13px] text-placeholder">
                      {filtersActive ? "Nenhum card corresponde ao filtro" : "Sem cards"}
                    </p>
                  ) : null}
                  {canManageCards ? <AddCardForm listId={list.id} /> : null}
                </ListColumn>
              ))}
              {canManageLists ? (
                <button
                  type="button"
                  onClick={() => setListDialog({ list: null })}
                  className="flex h-[60px] w-[351px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-outline-soft text-base text-muted hover:bg-black/[0.02]"
                >
                  <Plus size={15} aria-hidden />
                  Adicionar lista
                </button>
              ) : null}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeCard ? (
              <div className="rounded-[10px] border border-navy bg-surface p-[15px] shadow-lg">
                <CardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      {filtersActive && data.lists.length > 0 && countCards(visibleLists) === 0 ? (
        <p role="status" className="mb-3 rounded-lg bg-amber-bg px-3.5 py-2.5 text-sm text-amber-text">
          Nenhum card corresponde ao filtro.
        </p>
      ) : null}
      {data.lists.length === 0 && canManageLists ? (
        <p className="mt-4 text-[15px] text-muted">
          Este quadro ainda não tem listas. Crie a primeira para começar.
        </p>
      ) : null}
      <DeleteListDialog list={deleting} onClose={() => setDeleting(null)} />
      <ListDialog
        open={listDialog !== null}
        list={listDialog?.list ?? null}
        onClose={() => setListDialog(null)}
      />
    </>
  );
}
