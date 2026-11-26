import type { EntityManager, EntityTarget, ObjectLiteral } from "typeorm";

/** Clampa um índice desejado para o intervalo válido [0, length]. */
export function clampIndex(index: number | undefined, length: number): number {
  if (index === undefined || Number.isNaN(index)) {
    return length;
  }
  return Math.max(0, Math.min(Math.trunc(index), length));
}

/**
 * Regrava as posições como 0..n-1 seguindo a ordem do array, atualizando
 * apenas os registros cuja posição mudou.
 */
export async function persistOrder<T extends ObjectLiteral & { id: string; position: number }>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  items: T[],
): Promise<void> {
  for (const [index, item] of items.entries()) {
    if (item.position !== index) {
      item.position = index;
      await manager.update(entity, { id: item.id }, { position: index } as never);
    }
  }
}
