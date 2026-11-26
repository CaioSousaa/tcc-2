import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../database";
import { authorizeResource, type Resource } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import { loadProgress, type ChecklistView, type Progress } from "./checklists.read";

async function authorizeEdit(manager: EntityManager, userId: string, resource: Resource, id: string) {
  await authorizeResource(manager, userId, resource, id, "checklist.manage");
}

async function cardIdOfChecklist(manager: EntityManager, checklistId: string): Promise<string> {
  const rows: { card_id: string }[] = await manager.query(
    `SELECT card_id FROM checklists WHERE id = $1`,
    [checklistId],
  );
  if (rows.length === 0) throw errors.notFound("Checklist");
  return rows[0].card_id;
}

async function cardIdOfItem(manager: EntityManager, itemId: string): Promise<string> {
  const rows: { card_id: string }[] = await manager.query(
    `SELECT k.card_id
       FROM checklist_items i JOIN checklists k ON k.id = i.checklist_id
      WHERE i.id = $1`,
    [itemId],
  );
  if (rows.length === 0) throw errors.notFound("Item");
  return rows[0].card_id;
}

export async function createChecklist(
  userId: string,
  cardId: string,
  title: string,
): Promise<{ checklist: ChecklistView; progress: Progress }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "card", cardId);
    const rows: { id: string }[] = await manager.query(
      `INSERT INTO checklists (card_id, title) VALUES ($1, $2) RETURNING id`,
      [cardId, title],
    );
    return {
      checklist: { id: rows[0].id, title, items: [] },
      progress: await loadProgress(manager, cardId),
    };
  });
}

export async function renameChecklist(
  userId: string,
  checklistId: string,
  title: string,
): Promise<{ id: string; title: string }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "checklist", checklistId);
    const rows: { id: string; title: string }[] = await manager.query(
      `UPDATE checklists SET title = $2 WHERE id = $1 RETURNING id, title`,
      [checklistId, title],
    );
    if (rows.length === 0) throw errors.notFound("Checklist");
    return rows[0];
  });
}

export async function deleteChecklist(
  userId: string,
  checklistId: string,
): Promise<{ progress: Progress }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "checklist", checklistId);
    const cardId = await cardIdOfChecklist(manager, checklistId);
    await manager.query(`DELETE FROM checklists WHERE id = $1`, [checklistId]);
    return { progress: await loadProgress(manager, cardId) };
  });
}

export async function addItem(
  userId: string,
  checklistId: string,
  text: string,
): Promise<{ item: { id: string; text: string; done: boolean }; progress: Progress }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "checklist", checklistId);
    const cardId = await cardIdOfChecklist(manager, checklistId);
    const rows: { id: string }[] = await manager.query(
      `INSERT INTO checklist_items (checklist_id, text) VALUES ($1, $2) RETURNING id`,
      [checklistId, text],
    );
    return {
      item: { id: rows[0].id, text, done: false },
      progress: await loadProgress(manager, cardId),
    };
  });
}

/** `done` é um estado explícito, não um alternar: dois pedidos iguais dão o mesmo resultado (CB-25). */
export async function updateItem(
  userId: string,
  itemId: string,
  patch: { text?: string; done?: boolean },
): Promise<{ item: { id: string; text: string; done: boolean }; progress: Progress }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "item", itemId);
    const cardId = await cardIdOfItem(manager, itemId);

    const assignments: string[] = [];
    const values: unknown[] = [itemId];
    if (patch.text !== undefined) {
      values.push(patch.text);
      assignments.push(`text = $${values.length}`);
    }
    if (patch.done !== undefined) {
      values.push(patch.done);
      assignments.push(`done = $${values.length}`);
    }
    const rows: { id: string; text: string; done: boolean }[] = await manager.query(
      `UPDATE checklist_items SET ${assignments.join(", ")} WHERE id = $1 RETURNING id, text, done`,
      values,
    );
    if (rows.length === 0) throw errors.notFound("Item");
    return { item: rows[0], progress: await loadProgress(manager, cardId) };
  });
}

export async function deleteItem(userId: string, itemId: string): Promise<{ progress: Progress }> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeEdit(manager, userId, "item", itemId);
    const cardId = await cardIdOfItem(manager, itemId);
    await manager.query(`DELETE FROM checklist_items WHERE id = $1`, [itemId]);
    return { progress: await loadProgress(manager, cardId) };
  });
}
