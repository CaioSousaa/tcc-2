import { AppDataSource } from "../../database";
import { authorize } from "../../shared/board-access";
import type { Role } from "../../shared/policy";
import type { BoardColor } from "../../shared/validation";
import { DEFAULT_LIST_NAMES } from "./boards.schemas";
import {
  loadLabels,
  loadLists,
  loadMembers,
  type LabelView,
  type ListView,
  type MemberView,
} from "./boards.read";

export interface BoardSummary {
  id: string;
  name: string;
  color: BoardColor;
  role: Role;
  createdAt: Date;
}

export interface BoardListItem extends BoardSummary {
  listCount: number;
  cardCount: number;
  overdueCount: number;
  members: { userId: string; name: string }[];
}

export async function listBoards(userId: string, today?: string): Promise<BoardListItem[]> {
  const rows: {
    id: string;
    name: string;
    color: BoardColor;
    role: Role;
    created_at: Date;
    list_count: number;
    card_count: number;
    overdue_count: number;
  }[] = await AppDataSource.query(
    `SELECT b.id, b.name, b.color, m.role, b.created_at,
            (SELECT count(*) FROM lists l WHERE l.board_id = b.id)::int AS list_count,
            (SELECT count(*) FROM cards c WHERE c.board_id = b.id)::int AS card_count,
            (SELECT count(*) FROM cards c
              WHERE c.board_id = b.id AND NOT c.completed
                AND $2::date IS NOT NULL AND c.due_date < $2::date)::int AS overdue_count
       FROM boards b
       JOIN board_members m ON m.board_id = b.id
      WHERE m.user_id = $1
      ORDER BY b.created_at DESC, b.id`,
    [userId, today ?? null],
  );
  if (rows.length === 0) return [];

  const memberRows: { board_id: string; user_id: string; name: string }[] =
    await AppDataSource.query(
      `SELECT m.board_id, u.id AS user_id, u.name
         FROM board_members m JOIN users u ON u.id = m.user_id
        WHERE m.board_id = ANY($1::uuid[])
        ORDER BY (m.role = 'admin') DESC, lower(u.name), u.id`,
      [rows.map((row) => row.id)],
    );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    role: row.role,
    createdAt: row.created_at,
    listCount: row.list_count,
    cardCount: row.card_count,
    overdueCount: row.overdue_count,
    members: memberRows
      .filter((member) => member.board_id === row.id)
      .map((member) => ({ userId: member.user_id, name: member.name })),
  }));
}

/** Cria o quadro, o vínculo do criador como Administrador e, se pedido, as listas padrão (RT-11). */
export async function createBoard(
  userId: string,
  input: { name: string; color?: BoardColor; withDefaultLists?: boolean },
): Promise<BoardSummary> {
  return AppDataSource.transaction(async (manager) => {
    const color = input.color ?? "navy";
    const rows: { id: string; created_at: Date }[] = await manager.query(
      `INSERT INTO boards (name, color) VALUES ($1, $2) RETURNING id, created_at`,
      [input.name, color],
    );
    const board = rows[0];
    await manager.query(
      `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [board.id, userId],
    );
    if (input.withDefaultLists) {
      for (const [position, name] of DEFAULT_LIST_NAMES.entries()) {
        await manager.query(`INSERT INTO lists (board_id, name, position) VALUES ($1, $2, $3)`, [
          board.id,
          name,
          position,
        ]);
      }
    }
    return { id: board.id, name: input.name, color, role: "admin" as const, createdAt: board.created_at };
  });
}

export async function updateBoard(
  userId: string,
  boardId: string,
  patch: { name?: string; color?: BoardColor },
): Promise<BoardSummary> {
  return AppDataSource.transaction(async (manager) => {
    const role = await authorize(manager, userId, boardId, "board.update");

    const assignments: string[] = [];
    const values: unknown[] = [boardId];
    if (patch.name !== undefined) {
      values.push(patch.name);
      assignments.push(`name = $${values.length}`);
    }
    if (patch.color !== undefined) {
      values.push(patch.color);
      assignments.push(`color = $${values.length}`);
    }
    const rows: { id: string; name: string; color: BoardColor; created_at: Date }[] =
      await manager.query(
        `UPDATE boards SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1
         RETURNING id, name, color, created_at`,
        values,
      );
    const board = rows[0];
    return { id: board.id, name: board.name, color: board.color, role, createdAt: board.created_at };
  });
}

/** A exclusão em cascata é feita pelas chaves estrangeiras (RT-24). */
export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await authorize(manager, userId, boardId, "board.delete");
    await manager.query(`DELETE FROM boards WHERE id = $1`, [boardId]);
  });
}

export interface BoardFull {
  board: { id: string; name: string; color: BoardColor; myRole: Role; createdAt: Date };
  members: MemberView[];
  labels: LabelView[];
  lists: ListView[];
}

export async function getBoardFull(userId: string, boardId: string): Promise<BoardFull> {
  return AppDataSource.transaction(async (manager) => {
    const myRole = await authorize(manager, userId, boardId, "board.view");
    const rows: { id: string; name: string; color: BoardColor; created_at: Date }[] =
      await manager.query(`SELECT id, name, color, created_at FROM boards WHERE id = $1`, [boardId]);
    const board = rows[0];
    return {
      board: {
        id: board.id,
        name: board.name,
        color: board.color,
        myRole,
        createdAt: board.created_at,
      },
      members: await loadMembers(manager, boardId, myRole === "admin"),
      labels: await loadLabels(manager, boardId),
      lists: await loadLists(manager, boardId),
    };
  });
}
