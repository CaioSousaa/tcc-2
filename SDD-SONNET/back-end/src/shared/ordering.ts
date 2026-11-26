/**
 * Operações puras sobre listas ordenadas de identificadores (posição densa,
 * RT-09). O índice de destino é sempre relativo à lista **sem** o item movido,
 * e índices além do fim são limitados ao final (CB-17).
 */

export function clampIndex(index: number, length: number): number {
  if (index < 0) return 0;
  return index > length ? length : index;
}

export function insertAt(ids: readonly string[], id: string, index: number): string[] {
  const next = [...ids];
  next.splice(clampIndex(index, next.length), 0, id);
  return next;
}

export function removeId(ids: readonly string[], id: string): string[] {
  return ids.filter((current) => current !== id);
}

/** Move `id` dentro da mesma lista. Se `id` não estiver na lista, devolve cópia inalterada. */
export function moveWithin(ids: readonly string[], id: string, toIndex: number): string[] {
  if (!ids.includes(id)) return [...ids];
  return insertAt(removeId(ids, id), id, toIndex);
}

export function moveAcross(
  source: readonly string[],
  target: readonly string[],
  id: string,
  toIndex: number,
): { source: string[]; target: string[] } {
  return {
    source: removeId(source, id),
    target: insertAt(removeId(target, id), id, toIndex),
  };
}

/** Acrescenta ao final preservando a ordem relativa (exclusão de lista com migração, RF-14). */
export function appendAll(target: readonly string[], moved: readonly string[]): string[] {
  return [...target, ...moved];
}

export function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Mapa `id → posição` de uma ordem densa. */
export function toPositions(ids: readonly string[]): Map<string, number> {
  return new Map(ids.map((id, index) => [id, index]));
}
