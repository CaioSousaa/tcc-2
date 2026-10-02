import { AppDataSource } from "../../database";
import { Comment } from "../../entities/Comment";
import { authorize, boardIdOfCard } from "../../shared/access";
import type { UserDto } from "../auth/auth.types";

export interface CommentDto {
  id: string;
  cardId: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string };
}

interface CommentRow {
  id: string;
  cardId: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
}

/** Full history, oldest first, with the author's name (CM2, RN-F4). Any member can read it. */
export async function listComments(cardId: string, userId: string): Promise<CommentDto[]> {
  await authorize(await boardIdOfCard(cardId), userId, "observer");

  const rows: CommentRow[] = await AppDataSource.query(
    `SELECT c.id, c.card_id AS "cardId", c.body, c.created_at AS "createdAt",
            u.id AS "authorId", u.name AS "authorName"
       FROM comments c
       JOIN users u ON u.id = c.author_id
      WHERE c.card_id = $1
      ORDER BY c.created_at ASC, c.id ASC`,
    [cardId],
  );
  return rows.map((row) => ({
    id: row.id,
    cardId: row.cardId,
    body: row.body,
    createdAt: row.createdAt,
    author: { id: row.authorId, name: row.authorName },
  }));
}

export async function createComment(cardId: string, author: UserDto, body: string): Promise<CommentDto> {
  await authorize(await boardIdOfCard(cardId), author.id, "collaborator");

  const comments = AppDataSource.getRepository(Comment);
  const comment = await comments.save(comments.create({ cardId, authorId: author.id, body }));
  return {
    id: comment.id,
    cardId,
    body: comment.body,
    createdAt: comment.createdAt,
    author: { id: author.id, name: author.name },
  };
}
