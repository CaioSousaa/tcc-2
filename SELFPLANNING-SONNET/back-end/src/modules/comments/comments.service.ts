import { AppDataSource } from "../../database";
import { Comment } from "../../entities/Comment";
import { BoardRole } from "../../entities/BoardMember";
import { AppError } from "../../utils/AppError";

const comments = () => AppDataSource.getRepository(Comment);

function view(c: Comment) {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: { id: c.author.id, name: c.author.name },
  };
}

export async function listComments(cardId: string) {
  const rows = await comments().find({
    where: { cardId },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });
  return rows.map(view);
}

export async function createComment(cardId: string, authorId: string, content: string) {
  const saved = await comments().save(
    comments().create({ cardId, authorId, content: content.trim() }),
  );
  const full = await comments().findOneOrFail({
    where: { id: saved.id },
    relations: { author: true },
  });
  return view(full);
}

export async function deleteComment(commentId: string, userId: string, role: BoardRole) {
  const comment = await comments().findOneByOrFail({ id: commentId });
  if (comment.authorId !== userId && role !== "ADMIN") {
    throw new AppError(403, "Você só pode excluir os seus próprios comentários");
  }
  await comments().delete({ id: commentId });
}
