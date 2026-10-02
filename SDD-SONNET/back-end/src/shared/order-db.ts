import type { EntityManager } from "typeorm";

/** Grava a ordem densa das listas de um quadro (posição = índice no array). */
export async function persistListOrder(manager: EntityManager, listIds: string[]): Promise<void> {
  if (listIds.length === 0) return;
  await manager.query(
    `UPDATE lists SET position = t.pos
       FROM (SELECT id, (ord - 1)::int AS pos
               FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)) t
      WHERE lists.id = t.id`,
    [listIds],
  );
}

/** Grava a ordem densa dos cards de uma lista e os vincula a ela. */
export async function persistCardOrder(
  manager: EntityManager,
  listId: string,
  cardIds: string[],
): Promise<void> {
  if (cardIds.length === 0) return;
  await manager.query(
    `UPDATE cards SET position = t.pos, list_id = $2
       FROM (SELECT id, (ord - 1)::int AS pos
               FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)) t
      WHERE cards.id = t.id`,
    [cardIds, listId],
  );
}

export async function listIdsOfBoard(manager: EntityManager, boardId: string): Promise<string[]> {
  const rows: { id: string }[] = await manager.query(
    `SELECT id FROM lists WHERE board_id = $1 ORDER BY position, id`,
    [boardId],
  );
  return rows.map((row) => row.id);
}

export async function cardIdsOfList(manager: EntityManager, listId: string): Promise<string[]> {
  const rows: { id: string }[] = await manager.query(
    `SELECT id FROM cards WHERE list_id = $1 ORDER BY position, id`,
    [listId],
  );
  return rows.map((row) => row.id);
}
