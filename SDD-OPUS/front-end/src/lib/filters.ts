import { isOverdue } from "@/lib/dates";

/** Local, per-viewer view filter over the cards already loaded (RN-F2, RN-F3). */
export interface CardFilter {
  labelIds: ReadonlySet<string>;
  overdueOnly: boolean;
}

export const EMPTY_FILTER: CardFilter = { labelIds: new Set(), overdueOnly: false };

export function isFilterActive(filter: CardFilter): boolean {
  return filter.labelIds.size > 0 || filter.overdueOnly;
}

interface FilterableCard {
  labelIds: readonly string[];
  dueDate: string | null;
  completed: boolean;
}

/**
 * Label filter is a UNION: a card is visible when it carries at least one selected label.
 * Without a selection every card matches. The optional overdue filter is applied on top.
 */
export function cardMatchesFilter(card: FilterableCard, filter: CardFilter, today: string): boolean {
  if (filter.labelIds.size > 0 && !card.labelIds.some((id) => filter.labelIds.has(id))) {
    return false;
  }
  if (filter.overdueOnly && !isOverdue(card.dueDate, card.completed, today)) return false;
  return true;
}

/** B30: labels deleted meanwhile stop counting; with none left the label filter is off. */
export function pruneFilter(filter: CardFilter, existingLabelIds: ReadonlySet<string>): CardFilter {
  const kept = new Set([...filter.labelIds].filter((id) => existingLabelIds.has(id)));
  return kept.size === filter.labelIds.size ? filter : { ...filter, labelIds: kept };
}

export function toggleLabel(filter: CardFilter, labelId: string): CardFilter {
  const labelIds = new Set(filter.labelIds);
  if (labelIds.has(labelId)) labelIds.delete(labelId);
  else labelIds.add(labelId);
  return { ...filter, labelIds };
}
