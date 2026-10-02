import type { EntityManager } from "typeorm";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { requireRole } from "./access";
import { Errors } from "./errors";
import { isUuid } from "./ids";
import type { Role } from "./roles";

/**
 * Runs `fn` in a transaction holding a pessimistic write lock on the board row (plan §6.3, R-27).
 *
 * Operations that change positions or the existence of lists/cards, and membership changes, are
 * serialized per board through this lock. The caller's role is checked *after* the lock is
 * acquired, so it is stable for the whole transaction. The lock order is always board first.
 */
export async function withBoardLock<T>(
  boardId: string,
  userId: string,
  min: Role,
  fn: (em: EntityManager, role: Role) => Promise<T>,
): Promise<T> {
  if (!isUuid(boardId)) throw Errors.notFound();

  return AppDataSource.transaction(async (em) => {
    const board = await em
      .createQueryBuilder(Board, "b")
      .select("b.id")
      .where("b.id = :boardId", { boardId })
      .setLock("pessimistic_write")
      .getOne();
    if (!board) throw Errors.notFound();

    const role = await requireRole(em, boardId, userId, min);
    return fn(em, role);
  });
}
