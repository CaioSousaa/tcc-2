/**
 * Pure helpers for ordered containers (plan §3.4). Positions are dense, 0-based integers, so an
 * ordering is just the array of ids; persisting it means renumbering by array index.
 */

/** Clamps a requested position into 0..max (B19). Non-integers and NaN fall back to the end. */
export function clampPosition(position: number, max: number): number {
  if (!Number.isFinite(position)) return max;
  return Math.min(Math.max(Math.trunc(position), 0), max);
}

/** `ids` with `id` inserted at `position` (clamped). `id` must not already be in `ids`. */
export function insertAt(ids: readonly string[], id: string, position: number): string[] {
  const at = clampPosition(position, ids.length);
  return [...ids.slice(0, at), id, ...ids.slice(at)];
}

/** New order after moving `id` inside the same container. Position counts without `id`. */
export function moveWithin(ids: readonly string[], id: string, position: number): string[] {
  return insertAt(
    ids.filter((existing) => existing !== id),
    id,
    position,
  );
}

/** Closes the gap left by `id`. */
export function removeId(ids: readonly string[], id: string): string[] {
  return ids.filter((existing) => existing !== id);
}

export function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
