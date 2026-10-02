import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../database";
import { authorize, authorizeLocked, boardIdOf } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import { cardIdsOfList, persistCardOrder } from "../../shared/order-db";
import { isSameOrder, moveAcross, moveWithin, removeId } from "../../shared/ordering";
import { loadChecklists, type ChecklistView } from "../checklists/checklists.read";
import { loadComments, type CommentView } from "../comments/comments.read";
import { loadCardView, type CardView } from "./cards.read";

export interface CardDetail extends CardView {
  description: string | null;
  checklists: ChecklistView[];
  comments: CommentView[];
}

async function loadDetail(manager: EntityManager, view: CardView): Promise<CardDetail> {
  const rows: { description: string | null }[] = await manager.query(
    `SELECT description FROM cards WHERE id = $1`,
    [view.id],
  );
  return {
    ...view,
    description: rows[0]?.description ?? null,
    checklists: await loadChecklists(manager, view.id),
    comments: await loadComments(manager, view.id),
  };
}

export async function createCard(
  userId: string,
  listId: string,
  input: { title: string; description?: string | null },
): Promise<CardView> {
  return AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "list", listId);
    await authorizeLocked(manager, userId, boardId, "card.manage");

    const position = (await cardIdsOfList(manager, listId)).length;
    const rows: { id: string }[] = await manager.query(
      `INSERT INTO cards (list_id, board_id, title, description, position)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [listId, boardId, input.title, input.description ?? null, position],
    );
    return (await loadCardView(manager, rows[0].id)) as CardView;
  });
}

export async function getCard(userId: string, cardId: string): Promise<CardDetail> {
  return AppDataSource.transaction(async (manager) => {
    await authorize(manager, userId, await boardIdOf(manager, "card", cardId), "card.view");

    const view = await loadCardView(manager, cardId);
    if (!view) throw errors.notFound("Card");
    return loadDetail(manager, view);
  });
}

export async function updateCard(
  userId: string,
  cardId: string,
  patch: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    dueDate?: string | null;
  },
): Promise<CardDetail> {
  return AppDataSource.transaction(async (manager) => {
    await authorize(manager, userId, await boardIdOf(manager, "card", cardId), "card.manage");

    const assignments: string[] = [];
    const values: unknown[] = [cardId];
    const set = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };
    if (patch.title !== undefined) set("title", patch.title);
    if (patch.description !== undefined) set("description", patch.description);
    if (patch.completed !== undefined) set("completed", patch.completed);
    if (patch.dueDate !== undefined) set("due_date", patch.dueDate);

    const updated: { id: string }[] = await manager.query(
      `UPDATE cards SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1 RETURNING id`,
      values,
    );
    if (updated.length === 0) throw errors.notFound("Card");

    return loadDetail(manager, (await loadCardView(manager, cardId)) as CardView);
  });
}

export interface MoveResult {
  affected: { listId: string; cardIds: string[] }[];
}

export async function moveCard(
  userId: string,
  cardId: string,
  target: { listId: string; position: number },
): Promise<MoveResult> {
  return AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "card", cardId);
    await authorizeLocked(manager, userId, boardId, "card.manage");

    const cardRows: { list_id: string }[] = await manager.query(
      `SELECT list_id FROM cards WHERE id = $1`,
      [cardId],
    );
    if (cardRows.length === 0) throw errors.notFound("Card");
    const sourceListId = cardRows[0].list_id;

    // Lista inexistente (já excluída) ou de outro quadro: mesma recusa, sem vazar existência (CB-09, CB-18).
    const targetBoard = await boardIdOf(manager, "list", target.listId);
    if (targetBoard !== boardId) throw errors.targetListInvalid();

    const sourceIds = await cardIdsOfList(manager, sourceListId);
    if (sourceListId === target.listId) {
      const next = moveWithin(sourceIds, cardId, target.position);
      if (!isSameOrder(sourceIds, next)) await persistCardOrder(manager, sourceListId, next);
      return { affected: [{ listId: sourceListId, cardIds: next }] };
    }

    const targetIds = await cardIdsOfList(manager, target.listId);
    const moved = moveAcross(sourceIds, targetIds, cardId, target.position);
    await persistCardOrder(manager, target.listId, moved.target);
    await persistCardOrder(manager, sourceListId, moved.source);
    return {
      affected: [
        { listId: sourceListId, cardIds: moved.source },
        { listId: target.listId, cardIds: moved.target },
      ],
    };
  });
}

export async function deleteCard(userId: string, cardId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    const boardId = await boardIdOf(manager, "card", cardId);
    await authorizeLocked(manager, userId, boardId, "card.manage");

    const rows: { list_id: string }[] = await manager.query(
      `DELETE FROM cards WHERE id = $1 RETURNING list_id`,
      [cardId],
    );
    if (rows.length === 0) throw errors.notFound("Card");

    const remaining = await cardIdsOfList(manager, rows[0].list_id);
    await persistCardOrder(manager, rows[0].list_id, removeId(remaining, cardId));
  });
}
