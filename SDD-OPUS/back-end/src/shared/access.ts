import type { EntityManager } from "typeorm";
import { AppDataSource } from "../database";
import { BoardMember } from "../entities/BoardMember";
import { Errors } from "./errors";
import { isUuid } from "./ids";
import { hasAtLeast, type Role } from "./roles";

/**
 * Pure authorization decision (plan §4.2): no membership is "not found" (the board must look
 * nonexistent), an insufficient role is "forbidden".
 */
export function assertRole(role: Role | null, min: Role): Role {
  if (role === null) throw Errors.notFound();
  if (!hasAtLeast(role, min)) throw Errors.forbidden();
  return role;
}

export async function roleInBoard(
  em: EntityManager,
  boardId: string,
  userId: string,
): Promise<Role | null> {
  const member = await em.getRepository(BoardMember).findOne({ where: { boardId, userId } });
  return member?.role ?? null;
}

/** Resolves the caller's role in a board and enforces `min`. Reads the DB on every call (B10). */
export async function requireRole(
  em: EntityManager,
  boardId: string,
  userId: string,
  min: Role,
): Promise<Role> {
  if (!isUuid(boardId)) throw Errors.notFound();
  return assertRole(await roleInBoard(em, boardId, userId), min);
}

/** `requireRole` on the default connection, for operations that need no transaction. */
export function authorize(boardId: string, userId: string, min: Role): Promise<Role> {
  return requireRole(AppDataSource.manager, boardId, userId, min);
}

async function boardIdFrom(table: string, id: string): Promise<string> {
  if (!isUuid(id)) throw Errors.notFound();
  // `table` is a constant chosen by the helpers below, never user input.
  const rows: { board_id: string }[] = await AppDataSource.query(
    `SELECT board_id FROM ${table} WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) throw Errors.notFound();
  return rows[0].board_id;
}

// Resource → owning board. The board of a list/card/label never changes (R-12), so resolving it
// outside the transaction is safe; the role is always re-checked afterwards.
export const boardIdOfList = (listId: string) => boardIdFrom("lists", listId);
export const boardIdOfCard = (cardId: string) => boardIdFrom("cards", cardId);
export const boardIdOfLabel = (labelId: string) => boardIdFrom("labels", labelId);

export async function boardIdOfChecklist(checklistId: string): Promise<string> {
  if (!isUuid(checklistId)) throw Errors.notFound();
  const rows: { board_id: string }[] = await AppDataSource.query(
    `SELECT k.board_id FROM checklists c JOIN cards k ON k.id = c.card_id WHERE c.id = $1`,
    [checklistId],
  );
  if (rows.length === 0) throw Errors.notFound();
  return rows[0].board_id;
}

export async function boardIdOfChecklistItem(itemId: string): Promise<string> {
  if (!isUuid(itemId)) throw Errors.notFound();
  const rows: { board_id: string }[] = await AppDataSource.query(
    `SELECT k.board_id FROM checklist_items i
       JOIN checklists c ON c.id = i.checklist_id
       JOIN cards k ON k.id = c.card_id
      WHERE i.id = $1`,
    [itemId],
  );
  if (rows.length === 0) throw Errors.notFound();
  return rows[0].board_id;
}
