import type { EntityManager } from "typeorm";

export interface CommentView {
  id: string;
  text: string;
  createdAt: Date;
  author: { id: string; name: string };
}

interface CommentRow {
  id: string;
  text: string;
  created_at: Date;
  author_id: string;
  author_name: string;
}

function toView(row: CommentRow): CommentView {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
    author: { id: row.author_id, name: row.author_name },
  };
}

/** Histórico em ordem cronológica crescente, desempate por `id` (RN-30, RT-28). */
export async function loadComments(manager: EntityManager, cardId: string): Promise<CommentView[]> {
  const rows: CommentRow[] = await manager.query(
    `SELECT m.id, m.text, m.created_at, u.id AS author_id, u.name AS author_name
       FROM comments m
       JOIN users u ON u.id = m.author_id
      WHERE m.card_id = $1
      ORDER BY m.created_at ASC, m.id ASC`,
    [cardId],
  );
  return rows.map(toView);
}

export async function loadComment(manager: EntityManager, commentId: string): Promise<CommentView> {
  const rows: CommentRow[] = await manager.query(
    `SELECT m.id, m.text, m.created_at, u.id AS author_id, u.name AS author_name
       FROM comments m
       JOIN users u ON u.id = m.author_id
      WHERE m.id = $1`,
    [commentId],
  );
  return toView(rows[0]);
}
