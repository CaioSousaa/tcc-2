import type { EntityManager } from "typeorm";

export interface ChecklistView {
  id: string;
  title: string;
  items: { id: string; text: string; done: boolean }[];
}

export interface Progress {
  done: number;
  total: number;
}

/** Checklists e itens de um card, em ordem determinística (RT-28). */
export async function loadChecklists(
  manager: EntityManager,
  cardId: string,
): Promise<ChecklistView[]> {
  const lists: { id: string; title: string }[] = await manager.query(
    `SELECT id, title FROM checklists WHERE card_id = $1 ORDER BY created_at, id`,
    [cardId],
  );
  if (lists.length === 0) return [];

  const items: { id: string; checklist_id: string; text: string; done: boolean }[] =
    await manager.query(
      `SELECT i.id, i.checklist_id, i.text, i.done
         FROM checklist_items i
         JOIN checklists k ON k.id = i.checklist_id
        WHERE k.card_id = $1
        ORDER BY i.created_at, i.id`,
      [cardId],
    );
  return lists.map((list) => ({
    ...list,
    items: items
      .filter((item) => item.checklist_id === list.id)
      .map(({ id, text, done }) => ({ id, text, done })),
  }));
}

/** Progresso do card inteiro: itens feitos e total, somando todos os checklists (RN-20). */
export async function loadProgress(manager: EntityManager, cardId: string): Promise<Progress> {
  const rows: { done: number; total: number }[] = await manager.query(
    `SELECT count(*) FILTER (WHERE i.done)::int AS done, count(i.id)::int AS total
       FROM checklist_items i
       JOIN checklists k ON k.id = i.checklist_id
      WHERE k.card_id = $1`,
    [cardId],
  );
  return rows[0];
}
