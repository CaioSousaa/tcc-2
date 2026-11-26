import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { Comment } from "../../entities/Comment";
import { AppError, notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { idParam } from "../../utils/validate";
import { serializeComment } from "../serializers";

const commentSchema = z.object({
  content: z.string().trim().min(1, "O comentário não pode ficar vazio").max(5000),
});

const comments = () => AppDataSource.getRepository(Comment);

/** Busca um comentário do quadro que pertença ao usuário autenticado. */
async function findOwnComment(boardId: string, commentId: string, userId: string) {
  const comment = await comments().findOne({
    where: { id: commentId, card: { list: { boardId } } },
    relations: { author: true },
  });
  if (!comment) {
    throw notFound("Comentário não encontrado");
  }
  if (comment.authorId !== userId) {
    throw new AppError("Só o autor pode alterar este comentário", 403);
  }
  return comment;
}

/** Rotas montadas em /boards/:boardId/comments */
export const commentsRoutes = Router({ mergeParams: true });

commentsRoutes.patch("/:commentId", requireBoardRole("editor"), async (req, res) => {
  const { content } = commentSchema.parse(req.body);
  const comment = await findOwnComment(
    req.membership.boardId,
    idParam(req, "commentId"),
    req.userId,
  );

  comment.content = content;
  const saved = await comments().save(comment);
  res.json(serializeComment(saved));
});

commentsRoutes.delete("/:commentId", requireBoardRole("editor"), async (req, res) => {
  const comment = await findOwnComment(
    req.membership.boardId,
    idParam(req, "commentId"),
    req.userId,
  );

  await comments().delete({ id: comment.id });
  res.status(204).send();
});
