import { AppDataSource } from "../../database";
import { authorizeResource } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import { isUuid } from "../../shared/validation";

/** Só membros do quadro (qualquer papel, RN-25) podem ser responsáveis. Idempotente (RT-36). */
export async function assignMember(
  actorId: string,
  cardId: string,
  targetUserId: string,
): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    const { boardId } = await authorizeResource(manager, actorId, "card", cardId, "assignee.manage");
    if (!isUuid(targetUserId)) throw errors.notFound("Membro");

    const members: { user_id: string }[] = await manager.query(
      `SELECT user_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, targetUserId],
    );
    if (members.length === 0) throw errors.notFound("Membro");

    await manager.query(
      `INSERT INTO card_assignees (card_id, board_id, user_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [cardId, boardId, targetUserId],
    );
  });
}

export async function unassignMember(
  actorId: string,
  cardId: string,
  targetUserId: string,
): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await authorizeResource(manager, actorId, "card", cardId, "assignee.manage");
    if (!isUuid(targetUserId)) throw errors.notFound("Membro");
    await manager.query(`DELETE FROM card_assignees WHERE card_id = $1 AND user_id = $2`, [
      cardId,
      targetUserId,
    ]);
  });
}
