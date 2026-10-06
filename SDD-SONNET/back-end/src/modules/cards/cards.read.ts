import type { EntityManager } from "typeorm";

export interface CardView {
  id: string;
  listId: string;
  title: string;
  position: number;
  completed: boolean;
  dueDate: string | null;
  labelIds: string[];
  assigneeIds: string[];
  progress: { done: number; total: number };
  commentCount: number;
  hasDescription: boolean;
}

interface CardRow {
  id: string;
  list_id: string;
  title: string;
  position: number;
  completed: boolean;
  due_date: string | null;
  has_description: boolean;
  progress_done: number;
  progress_total: number;
  label_ids: string[];
  assignee_ids: string[];
  comment_count: number;
}

/** Colunas de resumo do card (a mesma consulta serve ao quadro e a um card isolado). */
const SUMMARY_COLUMNS = `
  c.id, c.list_id, c.title, c.position, c.completed,
  to_char(c.due_date, 'YYYY-MM-DD') AS due_date,
  (c.description IS NOT NULL AND c.description <> '') AS has_description,
  (SELECT count(*) FROM checklist_items i JOIN checklists k ON k.id = i.checklist_id
    WHERE k.card_id = c.id AND i.done)::int AS progress_done,
  (SELECT count(*) FROM checklist_items i JOIN checklists k ON k.id = i.checklist_id
    WHERE k.card_id = c.id)::int AS progress_total,
  ARRAY(SELECT cl.label_id FROM card_labels cl WHERE cl.card_id = c.id ORDER BY cl.label_id)
    AS label_ids,
  ARRAY(SELECT ca.user_id FROM card_assignees ca WHERE ca.card_id = c.id ORDER BY ca.user_id)
    AS assignee_ids,
  (SELECT count(*) FROM comments m WHERE m.card_id = c.id)::int AS comment_count`;

function toView(row: CardRow): CardView {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    position: row.position,
    completed: row.completed,
    dueDate: row.due_date,
    hasDescription: row.has_description,
    labelIds: row.label_ids,
    assigneeIds: row.assignee_ids,
    progress: { done: row.progress_done, total: row.progress_total },
    commentCount: row.comment_count,
  };
}

/** Todos os cards de um quadro, ordenados por lista e posição, em uma única consulta (RT-34). */
export async function loadBoardCards(manager: EntityManager, boardId: string): Promise<CardView[]> {
  const rows: CardRow[] = await manager.query(
    `SELECT ${SUMMARY_COLUMNS}
       FROM cards c
      WHERE c.board_id = $1
      ORDER BY c.list_id, c.position, c.id`,
    [boardId],
  );
  return rows.map(toView);
}

export async function loadCardView(
  manager: EntityManager,
  cardId: string,
): Promise<CardView | null> {
  const rows: CardRow[] = await manager.query(
    `SELECT ${SUMMARY_COLUMNS} FROM cards c WHERE c.id = $1`,
    [cardId],
  );
  return rows[0] ? toView(rows[0]) : null;
}
