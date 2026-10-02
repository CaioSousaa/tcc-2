import { AppDataSource } from "../../database";
import { Errors } from "../../shared/errors";
import { isUuid } from "../../shared/ids";
import {
  assembleBoardDetail,
  type BoardDetailDto,
  type BoardRow,
  type CardAssigneeRow,
  type CardLabelRow,
  type CardRow,
  type LabelRow,
  type ListRow,
  type MemberRow,
  type ProgressRow,
} from "./boardDetail.assemble";

/**
 * Loads a whole board in a constant number of queries — 8, regardless of how many cards it has
 * (plan §6.2, R-32) — inside one REPEATABLE READ transaction so the payload is a consistent
 * snapshot. Anyone who is not a member gets 404 (RN-B1).
 */
export async function getBoardDetail(boardId: string, userId: string): Promise<BoardDetailDto> {
  if (!isUuid(boardId)) throw Errors.notFound();

  return AppDataSource.transaction("REPEATABLE READ", async (em) => {
    const boards: BoardRow[] = await em.query(
      `SELECT b.id, b.name, b.description, bm.role
         FROM boards b
         JOIN board_members bm ON bm.board_id = b.id AND bm.user_id = $2
        WHERE b.id = $1`,
      [boardId, userId],
    );
    if (boards.length === 0) throw Errors.notFound();

    const members: MemberRow[] = await em.query(
      `SELECT u.id AS "userId", u.name, u.email, bm.role
         FROM board_members bm
         JOIN users u ON u.id = bm.user_id
        WHERE bm.board_id = $1
        ORDER BY bm.created_at, u.id`,
      [boardId],
    );
    const labels: LabelRow[] = await em.query(
      `SELECT id, name, color FROM labels WHERE board_id = $1 ORDER BY name_key, id`,
      [boardId],
    );
    const lists: ListRow[] = await em.query(
      `SELECT id, name, position FROM lists WHERE board_id = $1 ORDER BY position, created_at`,
      [boardId],
    );
    const cards: CardRow[] = await em.query(
      `SELECT id, list_id AS "listId", title, position, due_date AS "dueDate", completed
         FROM cards WHERE board_id = $1 ORDER BY position, created_at`,
      [boardId],
    );
    // Checklist progress is aggregated in the database; items are never loaded here.
    const progress: ProgressRow[] = await em.query(
      `SELECT c.card_id AS "cardId",
              (COUNT(i.id) FILTER (WHERE i.checked))::int AS checked,
              COUNT(i.id)::int AS total
         FROM checklists c
         JOIN checklist_items i ON i.checklist_id = c.id
         JOIN cards k ON k.id = c.card_id
        WHERE k.board_id = $1
        GROUP BY c.card_id`,
      [boardId],
    );
    const cardLabels: CardLabelRow[] = await em.query(
      `SELECT cl.card_id AS "cardId", cl.label_id AS "labelId"
         FROM card_labels cl JOIN cards k ON k.id = cl.card_id
        WHERE k.board_id = $1`,
      [boardId],
    );
    const cardAssignees: CardAssigneeRow[] = await em.query(
      `SELECT ca.card_id AS "cardId", ca.user_id AS "userId"
         FROM card_assignees ca JOIN cards k ON k.id = ca.card_id
        WHERE k.board_id = $1`,
      [boardId],
    );

    return assembleBoardDetail({
      board: boards[0],
      members,
      labels,
      lists,
      cards,
      progress,
      cardLabels,
      cardAssignees,
    });
  });
}
