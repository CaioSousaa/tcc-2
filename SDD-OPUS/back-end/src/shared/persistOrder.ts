import type { EntityManager } from "typeorm";

type OrderedTable = "lists" | "cards";

/**
 * Persists an ordering in one statement: position = index in `ids`. Callers already hold the
 * board lock (R-27), so no concurrent reorder can interleave. `table` is a closed union, never
 * user input.
 */
export async function persistOrder(
  em: EntityManager,
  table: OrderedTable,
  ids: readonly string[],
): Promise<void> {
  if (ids.length === 0) return;
  await em.query(
    `UPDATE ${table} AS t
        SET position = o.ord - 1
       FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, ord)
      WHERE t.id = o.id AND t.position IS DISTINCT FROM (o.ord - 1)`,
    [ids],
  );
}
