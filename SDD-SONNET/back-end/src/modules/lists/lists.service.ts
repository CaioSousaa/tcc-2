import { AppDataSource } from "../../database";
import { authorizeLocked, boardIdOf } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import {
  cardIdsOfList,
  listIdsOfBoard,
  persistCardOrder,
  persistListOrder,
} from "../../shared/order-db";
import { appendAll, isSameOrder, moveWithin, removeId } from "../../shared/ordering";
import { decideListDeletion, type DeleteStrategy } from "./lists.rules";

export interface ListResult {
  id: string;
  name: string;
  position: number;
}

export async function createList(
  userId: string,
  boardId: string,
  name: string,
): Promise<ListResult> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeLocked(manager, userId, boardId, "list.manage");
    const count = (await listIdsOfBoard(manager, boardId)).length;
    const rows: { id: string }[] = await manager.query(
      `INSERT INTO lists (board_id, name, position) VALUES ($1, $2, $3) RETURNING id`,
      [boardId, name, count],
    );
    return { id: rows[0].id, name, position: count };
  });
}

export async function renameList(
  userId: string,
  listId: string,
  name: string,
): Promise<ListResult> {
  return AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "list", listId);
    await authorizeLocked(manager, userId, boardId, "list.manage");
    const rows: { id: string; name: string; position: number }[] = await manager.query(
      `UPDATE lists SET name = $2 WHERE id = $1 RETURNING id, name, position`,
      [listId, name],
    );
    if (rows.length === 0) throw errors.notFound("Lista");
    return rows[0];
  });
}

export async function moveList(
  userId: string,
  listId: string,
  position: number,
): Promise<{ listIds: string[] }> {
  return AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "list", listId);
    await authorizeLocked(manager, userId, boardId, "list.manage");

    const current = await listIdsOfBoard(manager, boardId as string);
    if (!current.includes(listId)) throw errors.notFound("Lista");

    const next = moveWithin(current, listId, position);
    if (!isSameOrder(current, next)) await persistListOrder(manager, next);
    return { listIds: next };
  });
}

export async function deleteList(
  userId: string,
  listId: string,
  options: { strategy?: DeleteStrategy; targetListId?: string },
): Promise<{ movedCount: number }> {
  return AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "list", listId);
    await authorizeLocked(manager, userId, boardId, "list.manage");

    const lists = await listIdsOfBoard(manager, boardId as string);
    if (!lists.includes(listId)) throw errors.notFound("Lista");

    const cardIds = await cardIdsOfList(manager, listId);
    const decision = decideListDeletion({
      cardCount: cardIds.length,
      strategy: options.strategy,
      targetListId: options.targetListId,
      otherListIds: removeId(lists, listId),
    });

    if (decision.kind === "needs_choice") throw errors.listNotEmpty(decision.cardCount);
    if (decision.kind === "invalid_target") throw errors.targetListInvalid();

    let movedCount = 0;
    if (decision.kind === "move") {
      const targetCards = await cardIdsOfList(manager, decision.targetListId);
      await persistCardOrder(manager, decision.targetListId, appendAll(targetCards, cardIds));
      movedCount = cardIds.length;
    }

    // Se os cards não foram movidos, a cascata do banco os exclui junto (RT-24).
    await manager.query(`DELETE FROM lists WHERE id = $1`, [listId]);
    await persistListOrder(manager, removeId(lists, listId));
    return { movedCount };
  });
}
