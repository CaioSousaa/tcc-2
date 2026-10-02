import type { CardSummary, ListWithCards } from "./types";

function clamp(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

/** Move uma lista para o índice dado (relativo à ordem sem ela). Não muta a entrada. */
export function moveListInState(
  lists: ListWithCards[],
  listId: string,
  toIndex: number,
): ListWithCards[] {
  const from = lists.findIndex((item) => item.id === listId);
  if (from < 0) return lists;
  const next = [...lists];
  const [moved] = next.splice(from, 1);
  next.splice(clamp(toIndex, next.length), 0, moved);
  return next.map((item, position) => ({ ...item, position }));
}

/**
 * Move um card para `toListId` no índice dado (relativo à lista de destino sem
 * ele), mantendo posições densas nas listas afetadas (CA-31 a CA-33, RT-09).
 */
export function moveCardInState(
  lists: ListWithCards[],
  cardId: string,
  toListId: string,
  toIndex: number,
): ListWithCards[] {
  let moving: CardSummary | undefined;
  for (const list of lists) {
    moving = moving ?? list.cards.find((card) => card.id === cardId);
  }
  if (!moving || !lists.some((list) => list.id === toListId)) return lists;
  const card = moving;

  const withoutCard = lists.map((list) => ({
    ...list,
    cards: list.cards.filter((item) => item.id !== cardId),
  }));
  return withoutCard.map((list) => {
    if (list.id !== toListId) {
      return { ...list, cards: list.cards.map((item, position) => ({ ...item, position })) };
    }
    const cards = [...list.cards];
    cards.splice(clamp(toIndex, cards.length), 0, { ...card, listId: toListId });
    return { ...list, cards: cards.map((item, position) => ({ ...item, position })) };
  });
}

export function findCard(lists: ListWithCards[], cardId: string): CardSummary | undefined {
  for (const list of lists) {
    const found = list.cards.find((card) => card.id === cardId);
    if (found) return found;
  }
  return undefined;
}

export function indexOfCard(
  lists: ListWithCards[],
  cardId: string,
): { listId: string; index: number } | null {
  for (const list of lists) {
    const index = list.cards.findIndex((card) => card.id === cardId);
    if (index >= 0) return { listId: list.id, index };
  }
  return null;
}

/** Aplica um patch ao resumo de um card, sem mexer em posição nem lista. */
export function updateCardSummaryInState(
  lists: ListWithCards[],
  cardId: string,
  patch: Partial<CardSummary>,
): ListWithCards[] {
  return lists.map((list) => ({
    ...list,
    cards: list.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
  }));
}

/** Acrescenta um card ao final da lista indicada. */
export function appendCardInState(
  lists: ListWithCards[],
  card: CardSummary,
): ListWithCards[] {
  return lists.map((list) =>
    list.id === card.listId
      ? { ...list, cards: [...list.cards, { ...card, position: list.cards.length }] }
      : list,
  );
}

export interface ListPreviewItem {
  id: string | null;
  name: string;
  highlighted: boolean;
}

/**
 * Prévia da ordem das listas ao criar (`listId` nulo) ou mover uma lista para
 * `toIndex`, usada no modal de lista do protótipo ("Ordem das listas").
 */
export function previewListOrder(
  lists: ListWithCards[],
  listId: string | null,
  name: string,
  toIndex: number,
): ListPreviewItem[] {
  const others = lists
    .filter((list) => list.id !== listId)
    .map((list) => ({ id: list.id as string | null, name: list.name, highlighted: false }));
  const target = { id: listId, name, highlighted: true };
  others.splice(clamp(toIndex, others.length), 0, target);
  return others;
}
