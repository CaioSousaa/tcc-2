/**
 * Checklist progress of a card (RN-D1, R-29): checked ÷ total over all its checklists,
 * as an integer percentage rounded DOWN. No items → no percentage ("sem itens").
 * This is the only place that computes it (R-05).
 */
export function progressPercent(checked: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.floor((checked * 100) / total);
}

export function progressText(checked: number, total: number): string {
  return total <= 0 ? "sem itens" : `${checked}/${total}`;
}
