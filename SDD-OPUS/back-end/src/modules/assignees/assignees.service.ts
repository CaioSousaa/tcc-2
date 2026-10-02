import { AppDataSource } from "../../database";
import { CardAssignee } from "../../entities/CardAssignee";
import { authorize, boardIdOfCard, roleInBoard } from "../../shared/access";
import { Errors } from "../../shared/errors";

/**
 * Assigns a board member to a card (M4). Only members qualify (RN-R1) — observers included
 * (RN-R3). Idempotent: assigning twice keeps a single assignment (CA-M11).
 */
export async function assignMember(cardId: string, targetUserId: string, actorId: string): Promise<void> {
  const boardId = await boardIdOfCard(cardId);
  await authorize(boardId, actorId, "collaborator");

  if ((await roleInBoard(AppDataSource.manager, boardId, targetUserId)) === null) {
    throw Errors.userNotMember();
  }

  await AppDataSource.createQueryBuilder()
    .insert()
    .into(CardAssignee)
    .values({ cardId, userId: targetUserId })
    .orIgnore()
    .execute();
}

/** Idempotent; the person stays a board member (CA-M12). */
export async function unassignMember(cardId: string, targetUserId: string, actorId: string): Promise<void> {
  await authorize(await boardIdOfCard(cardId), actorId, "collaborator");
  await AppDataSource.getRepository(CardAssignee).delete({ cardId, userId: targetUserId });
}
