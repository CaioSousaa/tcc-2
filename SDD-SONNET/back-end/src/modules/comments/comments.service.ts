import { AppDataSource } from "../../database";
import { authorizeResource } from "../../shared/board-access";
import { loadComment, type CommentView } from "./comments.read";

export async function createComment(
  userId: string,
  cardId: string,
  text: string,
): Promise<CommentView> {
  return AppDataSource.transaction(async (manager) => {
    await authorizeResource(manager, userId, "card", cardId, "comment.create");
    const rows: { id: string }[] = await manager.query(
      `INSERT INTO comments (card_id, author_id, text) VALUES ($1, $2, $3) RETURNING id`,
      [cardId, userId, text],
    );
    return loadComment(manager, rows[0].id);
  });
}
