"use client";

import { useMemo, useRef, useState } from "react";
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
import type { BoardList, BoardMember, CardSummary, Label } from "@/lib/types";
import { CardItem } from "./CardItem";
import { ListColumn, listDndId } from "./ListColumn";

type DragData =
  | { type: "card"; cardId: string; listId: string }
  | { type: "list"; listId: string }
  | { type: "list-body"; listId: string };

interface BoardCanvasProps {
  lists: BoardList[];
  setLists: (updater: (lists: BoardList[]) => BoardList[]) => void;
  labelsById: Map<string, Label>;
  membersById: Map<string, BoardMember>;
  canManageLists: boolean;
  dragEnabled: boolean;
  filterCards: (cards: CardSummary[]) => CardSummary[];
  onOpenCard: (cardId: string) => void;
  onEditList: (list: BoardList) => void;
  onDeleteList: (list: BoardList) => void;
  onAddList: () => void;
  onCreateCard: (listId: string, title: string) => Promise<void>;
  onMoveCard: (cardId: string, listId: string, position: number) => void;
  onReorderLists: (listIds: string[]) => void;
}

function findCardLocation(lists: BoardList[], cardId: string) {
  for (const list of lists) {
    const index = list.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { listId: list.id, index };
  }
  return null;
}

/**
 * Cards prefer colliding with other cards under the pointer, then with the
 * body of a list (useful for empty lists). Lists only collide with lists.
 */
const collisionDetection: CollisionDetection = (args) => {
  const activeType = (args.active.data.current as DragData | undefined)?.type;
  if (activeType === "list") {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => (container.data.current as DragData | undefined)?.type === "list",
      ),
    });
  }

  const containers = args.droppableContainers.filter(
    (container) => (container.data.current as DragData | undefined)?.type !== "list",
  );
  const within = pointerWithin({ ...args, droppableContainers: containers });
  const cardHits = within.filter(
    (hit) =>
      (containers.find((c) => c.id === hit.id)?.data.current as DragData | undefined)
        ?.type === "card",
  );
  if (cardHits.length > 0) return cardHits;
  if (within.length > 0) return within;
  return closestCorners({ ...args, droppableContainers: containers });
};

export function BoardCanvas({
  lists,
  setLists,
  labelsById,
  membersById,
  canManageLists,
  dragEnabled,
  filterCards,
  onOpenCard,
  onEditList,
  onDeleteList,
  onAddList,
  onCreateCard,
  onMoveCard,
  onReorderLists,
}: BoardCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const [active, setActive] = useState<DragData | null>(null);
  // Where the dragged card was before the drag, to detect real moves/cancel.
  const snapshot = useRef<BoardList[] | null>(null);
  const origin = useRef<{ listId: string; index: number } | null>(null);

  const activeCard = useMemo(() => {
    if (active?.type !== "card") return null;
    for (const list of lists) {
      const card = list.cards.find((item) => item.id === active.cardId);
      if (card) return card;
    }
    return null;
  }, [active, lists]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData;
    setActive(data);
    snapshot.current = lists;
    if (data.type === "card") origin.current = findCardLocation(lists, data.cardId);
  }

  /** Moves the dragged card into another list while hovering it. */
  function handleDragOver(event: DragOverEvent) {
    const { active: dragged, over } = event;
    const data = dragged.data.current as DragData | undefined;
    if (!over || data?.type !== "card") return;
    const overData = over.data.current as DragData | undefined;
    if (!overData || overData.type === "list") return;

    setLists((current) => {
      const from = findCardLocation(current, data.cardId);
      if (!from) return current;
      const targetListId =
        overData.type === "card"
          ? findCardLocation(current, overData.cardId)?.listId
          : overData.listId;
      if (!targetListId || targetListId === from.listId) return current;

      const source = current.find((list) => list.id === from.listId)!;
      const target = current.find((list) => list.id === targetListId)!;
      const moving = source.cards[from.index];

      let insertAt = target.cards.length;
      if (overData.type === "card") {
        const overIndex = target.cards.findIndex((card) => card.id === overData.cardId);
        const translated = dragged.rect.current.translated;
        const below =
          translated && translated.top > over.rect.top + over.rect.height / 2;
        insertAt = overIndex + (below ? 1 : 0);
      }

      return current.map((list) => {
        if (list.id === source.id) {
          return { ...list, cards: list.cards.filter((card) => card.id !== moving.id) };
        }
        if (list.id === target.id) {
          const cards = [...list.cards];
          cards.splice(insertAt, 0, { ...moving, listId: target.id });
          return { ...list, cards };
        }
        return list;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active: dragged, over } = event;
    const data = dragged.data.current as DragData | undefined;
    setActive(null);

    if (data?.type === "list") {
      if (!over || over.id === dragged.id) return;
      const oldIndex = lists.findIndex((list) => listDndId(list.id) === dragged.id);
      const newIndex = lists.findIndex((list) => listDndId(list.id) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(lists, oldIndex, newIndex);
      setLists(() => reordered);
      onReorderLists(reordered.map((list) => list.id));
      return;
    }

    if (data?.type !== "card") return;
    const location = findCardLocation(lists, data.cardId);
    if (!location) return;

    let finalIndex = location.index;
    const overData = over?.data.current as DragData | undefined;
    if (overData?.type === "card" && overData.cardId !== data.cardId) {
      const overIndex = lists
        .find((list) => list.id === location.listId)!
        .cards.findIndex((card) => card.id === overData.cardId);
      if (overIndex !== -1) {
        finalIndex = overIndex;
        setLists((current) =>
          current.map((list) =>
            list.id === location.listId
              ? { ...list, cards: arrayMove(list.cards, location.index, overIndex) }
              : list,
          ),
        );
      }
    }

    const start = origin.current;
    origin.current = null;
    if (start && start.listId === location.listId && start.index === finalIndex) return;
    onMoveCard(data.cardId, location.listId, finalIndex);
  }

  function handleDragCancel() {
    setActive(null);
    origin.current = null;
    if (snapshot.current) {
      const previous = snapshot.current;
      setLists(() => previous);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="scrollbar-thin flex h-full items-start gap-[21px] overflow-x-auto px-[30px] pb-6 pt-[30px]">
        <SortableContext
          items={lists.map((list) => listDndId(list.id))}
          strategy={horizontalListSortingStrategy}
        >
          {lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              visibleCards={filterCards(list.cards)}
              canManage={canManageLists}
              labelsById={labelsById}
              membersById={membersById}
              dragEnabled={dragEnabled}
              onOpenCard={onOpenCard}
              onEdit={() => onEditList(list)}
              onDelete={() => onDeleteList(list)}
              onCreateCard={(title) => onCreateCard(list.id, title)}
            />
          ))}
        </SortableContext>

        {canManageLists && (
          <button
            type="button"
            onClick={onAddList}
            className="flex h-[60px] w-[300px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-outline-strong text-[15.5px] text-muted transition hover:border-navy hover:bg-surface hover:text-ink"
          >
            <Plus size={15} /> Adicionar lista
          </button>
        )}
        {lists.length === 0 && !canManageLists && (
          <p className="text-[15px] text-muted">
            Este quadro ainda não tem listas. Peça a um administrador para criá-las.
          </p>
        )}
      </div>

      <DragOverlay>
        {activeCard && (
          <CardItem
            card={activeCard}
            labelsById={labelsById}
            membersById={membersById}
            overlay
            className="w-[317px]"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
