import type { EntityManager, ObjectLiteral, EntityTarget } from "typeorm";

/**
 * Persists the index of each entity as its position, touching only rows whose
 * position actually changed.
 */
export async function persistOrder<T extends ObjectLiteral & { id: string; position: number }>(
  manager: EntityManager,
  target: EntityTarget<T>,
  items: T[],
) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.position !== index) {
      item.position = index;
      await manager
        .createQueryBuilder()
        .update(target)
        .set({ position: index } as never)
        .where("id = :id", { id: item.id })
        .execute();
    }
  }
}
