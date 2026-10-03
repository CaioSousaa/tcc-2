"use client";

import {
  closestCenter,
  closestCorners,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { ChevronLeft, Plus, Tag, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardDetailModal } from "@/components/card/CardDetailModal";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/UserMenu";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BoardDetail, CardSummary, ListWithCards } from "@/lib/types";
import { CardView } from "./CardItem";
import { DeleteListModal } from "./DeleteListModal";
import { LabelFilterBar } from "./LabelFilterBar";
import { LabelsModal } from "./LabelsModal";
import { ListColumn } from "./ListColumn";
import { MembersModal } from "./MembersModal";
import { NewListModal } from "./NewListModal";

const listKey = (id: string) => `list:${id}`;

function compareDue(a: CardSummary, b: CardSummary) {
  if (a.dueDate === b.dueDate) return a.position - b.position;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export function BoardView({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [sortByDue, setSortByDue] = useState(false);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [modal, setModal] = useState<"labels" | "members" | "newList" | null>(null);
  const [deletingList, setDeletingList] = useState<ListWithCards | null>(null);
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const dragOrigin = useRef<{ listId: string; index: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BoardDetail>(`/boards/${boardId}`);
      setBoard(data);
      setError(null);
    } catch (err) {
      if ((err as { response?: { status?: number } }).response?.status === 404) setNotFound(true);
      else setError(errorMessage(err));
    }
  }, [boardId]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = board?.role === "ADMIN";
  const filtering = selectedLabels.length > 0 || sortByDue;

  const mutateBoard = useCallback((fn: (b: BoardDetail) => BoardDetail) => {
    setBoard((prev) => (prev ? fn(prev) : prev));
  }, []);

  const replaceCard = useCallback(
    (card: CardSummary) =>
      mutateBoard((b) => ({
        ...b,
        lists: b.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => (c.id === card.id ? card : c)),
        })),
      })),
    [mutateBoard],
  );

  const visibleCards = useCallback(
    (list: ListWithCards) => {
      let cards = list.cards;
      if (selectedLabels.length > 0) {
        cards = cards.filter((c) => c.labels.some((l) => selectedLabels.includes(l.id)));
      }
      if (sortByDue) cards = [...cards].sort(compareDue);
      return cards;
    },
    [selectedLabels, sortByDue],
  );

  const totalCards = useMemo(
    () => (board ? board.lists.reduce((n, l) => n + l.cards.length, 0) : 0),
    [board],
  );

  const findListOfCard = useCallback(
    (cardId: string, lists: ListWithCards[]) => lists.find((l) => l.cards.some((c) => c.id === cardId)),
    [],
  );

  const collision: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === "list") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === "list",
        ),
      });
    }
    return closestCorners(args);
  }, []);

  function resolveListId(overId: string, overType: unknown, lists: ListWithCards[]) {
    if (overType === "list") return overId.replace("list:", "");
    return findListOfCard(overId, lists)?.id;
  }

  function onDragStart(e: DragStartEvent) {
    if (!board || e.active.data.current?.type !== "card") return;
    const id = String(e.active.id);
    const list = findListOfCard(id, board.lists);
    if (!list) return;
    dragOrigin.current = { listId: list.id, index: list.cards.findIndex((c) => c.id === id) };
    setActiveCard(list.cards.find((c) => c.id === id) ?? null);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!board || !over || active.data.current?.type !== "card") return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findListOfCard(activeId, board.lists);
    const toId = resolveListId(overId, over.data.current?.type, board.lists);
    if (!from || !toId || from.id === toId) return;

    mutateBoard((b) => {
      const source = b.lists.find((l) => l.id === from.id);
      const target = b.lists.find((l) => l.id === toId);
      const card = source?.cards.find((c) => c.id === activeId);
      if (!source || !target || !card) return b;

      const overIndex = target.cards.findIndex((c) => c.id === overId);
      let index = target.cards.length;
      if (overIndex >= 0) {
        const below =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      return {
        ...b,
        lists: b.lists.map((l) => {
          if (l.id === source.id) return { ...l, cards: l.cards.filter((c) => c.id !== activeId) };
          if (l.id === target.id) {
            const cards = [...l.cards];
            cards.splice(index, 0, { ...card, listId: target.id });
            return { ...l, cards };
          }
          return l;
        }),
      };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveCard(null);
    if (!board || !over) {
      if (dragOrigin.current) load();
      dragOrigin.current = null;
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);

    if (active.data.current?.type === "list") {
      const toId = resolveListId(overId, over.data.current?.type, board.lists);
      const fromIndex = board.lists.findIndex((l) => l.id === activeId.replace("list:", ""));
      const toIndex = board.lists.findIndex((l) => l.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      mutateBoard((b) => ({ ...b, lists: arrayMove(b.lists, fromIndex, toIndex) }));
      try {
        await api.patch(`/lists/${activeId.replace("list:", "")}/move`, { position: toIndex });
      } catch (err) {
        setError(errorMessage(err));
        load();
      }
      return;
    }

    const origin = dragOrigin.current;
    dragOrigin.current = null;
    const list = findListOfCard(activeId, board.lists);
    if (!list || !origin) return;

    let index = list.cards.findIndex((c) => c.id === activeId);
    const overIndex = list.cards.findIndex((c) => c.id === overId);
    if (overIndex >= 0 && overIndex !== index) {
      mutateBoard((b) => ({
        ...b,
        lists: b.lists.map((l) =>
          l.id === list.id ? { ...l, cards: arrayMove(l.cards, index, overIndex) } : l,
        ),
      }));
      index = overIndex;
    }
    if (list.id === origin.listId && index === origin.index) return;

    try {
      await api.patch(`/cards/${activeId}/move`, { listId: list.id, position: index });
    } catch (err) {
      setError(errorMessage(err));
      load();
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted">
        Quadro não encontrado ou sem acesso.
        <Link href="/quadros" className="font-medium text-navy hover:underline">
          Voltar para meus quadros
        </Link>
      </div>
    );
  }
  if (!board || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        {error ?? "Carregando quadro..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
        <Link
          href="/quadros"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ChevronLeft size={16} /> Quadros
        </Link>
        <span className="h-5 w-px bg-border" />
        <h1 className="truncate text-base font-semibold text-ink">{board.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={() => setModal("labels")}>
            <Tag size={14} /> Etiquetas
          </Button>
          <Button variant="secondary" onClick={() => setModal("members")}>
            <Users size={14} /> Membros
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <UserMenu />
        </div>
      </header>

      <LabelFilterBar
        labels={board.labels}
        selected={selectedLabels}
        onToggle={(id) =>
          setSelectedLabels((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
        }
        onClear={() => setSelectedLabels([])}
        total={totalCards}
        sortByDue={sortByDue}
        onToggleSort={() => setSortByDue((v) => !v)}
      />

      {error && (
        <div
          className="flex items-center justify-between bg-red-bg px-6 py-2 text-sm text-red-dark"
          role="alert"
        >
          {error}
          <button type="button" onClick={() => setError(null)} className="text-xs underline">
            Fechar
          </button>
        </div>
      )}
      {filtering && (
        <p className="bg-amber-bg px-6 py-1.5 text-xs text-amber-text">
          Arrastar cards fica desativado enquanto há filtro ou ordenação por prazo ativos.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveCard(null);
          dragOrigin.current = null;
          load();
        }}
      >
        <div className="flex flex-1 items-start gap-4 overflow-x-auto p-6">
          <SortableContext
            items={board.lists.map((l) => listKey(l.id))}
            strategy={horizontalListSortingStrategy}
          >
            {board.lists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                cards={visibleCards(list)}
                isAdmin={isAdmin}
                cardDragDisabled={filtering}
                onOpenCard={setOpenCardId}
                onCardCreated={(card) =>
                  mutateBoard((b) => ({
                    ...b,
                    lists: b.lists.map((l) =>
                      l.id === list.id ? { ...l, cards: [...l.cards, card] } : l,
                    ),
                  }))
                }
                onRenamed={(id, name) =>
                  mutateBoard((b) => ({
                    ...b,
                    lists: b.lists.map((l) => (l.id === id ? { ...l, name } : l)),
                  }))
                }
                onDelete={() => setDeletingList(list)}
                onError={setError}
              />
            ))}
          </SortableContext>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setModal("newList")}
              className="flex h-12 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/60 text-sm font-medium text-muted hover:border-navy hover:text-navy"
            >
              <Plus size={16} /> Nova lista
            </button>
          )}
          {board.lists.length === 0 && !isAdmin && (
            <p className="text-sm text-muted">Este quadro ainda não tem listas.</p>
          )}
        </div>
        <DragOverlay>
          {activeCard && (
            <div className="w-72 rotate-2 cursor-grabbing">
              <CardView card={activeCard} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {modal === "newList" && (
        <NewListModal
          boardId={board.id}
          onClose={() => setModal(null)}
          onCreated={(list) => {
            mutateBoard((b) => ({ ...b, lists: [...b.lists, list] }));
            setModal(null);
          }}
        />
      )}
      {modal === "labels" && (
        <LabelsModal
          boardId={board.id}
          labels={board.labels}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onChanged={load}
        />
      )}
      {modal === "members" && (
        <MembersModal
          boardId={board.id}
          members={board.members}
          currentUserId={user.id}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onChanged={load}
          onLeft={() => router.replace("/quadros")}
        />
      )}
      {deletingList && (
        <DeleteListModal
          list={deletingList}
          otherLists={board.lists.filter((l) => l.id !== deletingList.id)}
          onClose={() => setDeletingList(null)}
          onDeleted={() => {
            setDeletingList(null);
            load();
          }}
        />
      )}
      {openCardId && (
        <CardDetailModal
          cardId={openCardId}
          board={board}
          currentUserId={user.id}
          onClose={() => {
            setOpenCardId(null);
            load();
          }}
          onUpdated={replaceCard}
          onDeleted={(id) => {
            mutateBoard((b) => ({
              ...b,
              lists: b.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== id) })),
            }));
            setOpenCardId(null);
          }}
        />
      )}
    </div>
  );
}
