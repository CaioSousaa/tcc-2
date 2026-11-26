import type { EntityManager } from "typeorm";
import { loadBoardCards, type CardView } from "../cards/cards.read";

export interface MemberView {
  userId: string;
  name: string;
  /** Só Administradores veem o e-mail dos membros (o protótipo o mostra na gestão de membros). */
  email: string | null;
  role: "admin" | "member" | "viewer";
}

export async function loadMembers(
  manager: EntityManager,
  boardId: string,
  includeEmail: boolean,
): Promise<MemberView[]> {
  const rows: { user_id: string; name: string; email: string; role: MemberView["role"] }[] =
    await manager.query(
      `SELECT m.user_id, u.name, u.email, m.role
         FROM board_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.board_id = $1
        ORDER BY (m.role = 'admin') DESC, lower(u.name), m.user_id`,
      [boardId],
    );
  return rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: includeEmail ? row.email : null,
    role: row.role,
  }));
}

export interface ListView {
  id: string;
  name: string;
  position: number;
  cards: CardView[];
}

export async function loadLists(manager: EntityManager, boardId: string): Promise<ListView[]> {
  const rows: { id: string; name: string; position: number }[] = await manager.query(
    `SELECT id, name, position FROM lists WHERE board_id = $1 ORDER BY position, id`,
    [boardId],
  );
  const cards = await loadBoardCards(manager, boardId);
  return rows.map((row) => ({
    ...row,
    cards: cards.filter((card) => card.listId === row.id),
  }));
}

export interface LabelView {
  id: string;
  name: string;
  color: string;
}

export async function loadLabels(manager: EntityManager, boardId: string): Promise<LabelView[]> {
  return manager.query(
    `SELECT id, name, color FROM labels WHERE board_id = $1 ORDER BY name_key, id`,
    [boardId],
  );
}
