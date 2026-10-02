import type { BoardList, CardSummary } from "@/lib/types";

/** Moves the item at `from` to index `to` (same semantics as dnd-kit's arrayMove). */
export function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = [...items];
  if (from < 0 || from >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(Math.min(Math.max(to, 0), copy.length), 0, item);
  return copy;
}

const renumber = (cards: CardSummary[], listId: string): CardSummary[] =>
  cards.map((card, index) => ({ ...card, listId, position: index }));

export function locateCard(
  lists: readonly BoardList[],
  cardId: string,
): { listId: string; position: number } | null {
  for (const list of lists) {
    const position = list.cards.findIndex((card) => card.id === cardId);
    if (position !== -1) return { listId: list.id, position };
  }
  return null;
}

/**
 * Drag preview across lists: removes the card from its list and inserts it in `toListId`
 * next to `overCardId` (before it, or after when `after`), or at the end when `overCardId` is
 * null. Indexes are those of the FULL list, so it also works while a view filter hides cards.
 */
export function moveCardToList(
  lists: readonly BoardList[],
  cardId: string,
  toListId: string,
  overCardId: string | null,
  after = false,
): BoardList[] {
  const from = locateCard(lists, cardId);
  const card = from && lists.find((list) => list.id === from.listId)?.cards[from.position];
  if (!from || !card || !lists.some((list) => list.id === toListId)) return [...lists];

  const withoutCard = lists.map((list) =>
    list.id === from.listId
      ? { ...list, cards: renumber(list.cards.filter((c) => c.id !== cardId), list.id) }
      : list,
  );

  return withoutCard.map((list) => {
    if (list.id !== toListId) return list;
    const overIndex = overCardId === null ? -1 : list.cards.findIndex((c) => c.id === overCardId);
    const at = overIndex === -1 ? list.cards.length : overIndex + (after ? 1 : 0);
    const cards = [...list.cards.slice(0, at), card, ...list.cards.slice(at)];
    return { ...list, cards: renumber(cards, list.id) };
  });
}

/** Reorders a card inside its list so that it takes the place of `overCardId`. */
export function reorderCardInList(
  lists: readonly BoardList[],
  listId: string,
  cardId: string,
  overCardId: string,
): BoardList[] {
  return lists.map((list) => {
    if (list.id !== listId) return list;
    const from = list.cards.findIndex((c) => c.id === cardId);
    const to = list.cards.findIndex((c) => c.id === overCardId);
    if (from === -1 || to === -1 || from === to) return list;
    return { ...list, cards: renumber(arrayMove(list.cards, from, to), list.id) };
  });
}

/** Reorders lists so that `listId` takes the place of `overListId`. */
export function reorderLists(
  lists: readonly BoardList[],
  listId: string,
  overListId: string,
): BoardList[] {
  const from = lists.findIndex((list) => list.id === listId);
  const to = lists.findIndex((list) => list.id === overListId);
  if (from === -1 || to === -1 || from === to) return [...lists];
  return arrayMove(lists, from, to).map((list, index) => ({ ...list, position: index }));
}

/** Where a card ended up, to send to the server; null when nothing changed. */
export function cardMoveBetween(
  before: readonly BoardList[],
  after: readonly BoardList[],
  cardId: string,
): { listId: string; position: number } | null {
  const a = locateCard(before, cardId);
  const b = locateCard(after, cardId);
  if (!b) return null;
  if (a && a.listId === b.listId && a.position === b.position) return null;
  return b;
}
