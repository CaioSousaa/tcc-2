import type { EntityManager } from "typeorm";
import { errors } from "./errors";
import { decideAccess, type Action, type Role } from "./policy";
import { isUuid } from "./validation";

export type Resource = "board" | "list" | "card" | "checklist" | "item" | "label";

const BOARD_ID_SQL: Record<Resource, string> = {
  board: `SELECT id AS board_id FROM boards WHERE id = $1`,
  list: `SELECT board_id FROM lists WHERE id = $1`,
  card: `SELECT board_id FROM cards WHERE id = $1`,
  checklist: `SELECT c.board_id FROM checklists k JOIN cards c ON c.id = k.card_id WHERE k.id = $1`,
  item: `SELECT c.board_id
           FROM checklist_items i
           JOIN checklists k ON k.id = i.checklist_id
           JOIN cards c ON c.id = k.card_id
          WHERE i.id = $1`,
  label: `SELECT board_id FROM labels WHERE id = $1`,
};

/** Resolve o quadro dono de um recurso. Identificador mal formado ou inexistente → `null`. */
export async function boardIdOf(
  manager: EntityManager,
  resource: Resource,
  id: string,
): Promise<string | null> {
  if (!isUuid(id)) return null;
  const rows: { board_id: string }[] = await manager.query(BOARD_ID_SQL[resource], [id]);
  return rows[0]?.board_id ?? null;
}

export async function getRole(
  manager: EntityManager,
  boardId: string,
  userId: string,
): Promise<Role | null> {
  const rows: { role: Role }[] = await manager.query(
    `SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2`,
    [boardId, userId],
  );
  return rows[0]?.role ?? null;
}

/**
 * Autoriza `userId` a executar `action` no quadro. O papel é lido do banco a
 * cada chamada (RN-09). Não membro → 404; membro sem permissão → 403 (RT-06).
 */
export async function authorize(
  manager: EntityManager,
  userId: string,
  boardId: string | null,
  action: Action,
): Promise<Role> {
  if (boardId === null) throw errors.notFound();
  const role = await getRole(manager, boardId, userId);
  const decision = decideAccess(role, action);
  if (decision === "not_found") throw errors.notFound();
  if (decision === "forbidden") throw errors.forbidden();
  return role as Role;
}

/** Atalho: resolve o quadro do recurso e autoriza. Devolve `{ boardId, role }`. */
export async function authorizeResource(
  manager: EntityManager,
  userId: string,
  resource: Resource,
  id: string,
  action: Action,
): Promise<{ boardId: string; role: Role }> {
  const boardId = await boardIdOf(manager, resource, id);
  const role = await authorize(manager, userId, boardId, action);
  return { boardId: boardId as string, role };
}

/** Bloqueio de escrita na linha do quadro: serializa mutações de ordem e membros (RT-07). */
export async function lockBoard(manager: EntityManager, boardId: string): Promise<void> {
  const rows: { id: string }[] = await manager.query(
    `SELECT id FROM boards WHERE id = $1 FOR UPDATE`,
    [boardId],
  );
  if (rows.length === 0) throw errors.notFound("Quadro");
}

/**
 * Autoriza, bloqueia o quadro e **reautoriza** já dentro do bloqueio, para que
 * papel alterado ou membro removido durante a operação seja respeitado (RT-08, CB-12).
 */
export async function authorizeLocked(
  manager: EntityManager,
  userId: string,
  boardId: string | null,
  action: Action,
): Promise<Role> {
  await authorize(manager, userId, boardId, action);
  await lockBoard(manager, boardId as string);
  return authorize(manager, userId, boardId, action);
}
