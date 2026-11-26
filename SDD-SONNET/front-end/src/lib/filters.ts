import { isOverdue } from "./date";
import type { CardSummary, ListWithCards } from "./types";

export interface BoardFilters {
  /** Cards com ao menos uma destas etiquetas (OU, RN-27). */
  labelIds: string[];
  /** Somente atrasados; combina com etiquetas por E (RN-27). */
  overdueOnly: boolean;
}

export const EMPTY_FILTERS: BoardFilters = { labelIds: [], overdueOnly: false };

export function isFilterActive(filters: BoardFilters): boolean {
  return filters.labelIds.length > 0 || filters.overdueOnly;
}

export function cardMatches(card: CardSummary, filters: BoardFilters, today: string): boolean {
  if (filters.labelIds.length > 0 && !card.labelIds.some((id) => filters.labelIds.includes(id))) {
    return false;
  }
  if (filters.overdueOnly && !isOverdue(card, today)) return false;
  return true;
}

/** Aplica os filtros mantendo **todas** as listas, mesmo as que ficam sem cards (CA-65). */
export function applyFilters(
  lists: ListWithCards[],
  filters: BoardFilters,
  today: string,
): ListWithCards[] {
  if (!isFilterActive(filters)) return lists;
  return lists.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => cardMatches(card, filters, today)),
  }));
}

/** Descarta do filtro etiquetas que já não existem; se era a única, o filtro fica limpo (CB-33). */
export function pruneFilters(filters: BoardFilters, existingLabelIds: string[]): BoardFilters {
  const labelIds = filters.labelIds.filter((id) => existingLabelIds.includes(id));
  return labelIds.length === filters.labelIds.length ? filters : { ...filters, labelIds };
}

export function toggleLabelFilter(filters: BoardFilters, labelId: string): BoardFilters {
  return {
    ...filters,
    labelIds: filters.labelIds.includes(labelId)
      ? filters.labelIds.filter((id) => id !== labelId)
      : [...filters.labelIds, labelId],
  };
}

export function countCards(lists: ListWithCards[]): number {
  return lists.reduce((total, list) => total + list.cards.length, 0);
}

/**
 * Ordena os cards de cada lista por prazo, do mais próximo ao mais distante; cards
 * sem prazo vão ao fim. Empate mantém a posição original (ordenação estável).
 * É só visualização e não altera dados nem posições (RF.md RF10).
 */
export function sortByDueDate(lists: ListWithCards[]): ListWithCards[] {
  return lists.map((list) => ({
    ...list,
    cards: [...list.cards].sort((a, b) => {
      if (a.dueDate === b.dueDate) return a.position - b.position;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }),
  }));
}
