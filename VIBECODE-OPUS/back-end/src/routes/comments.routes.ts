import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Comment } from "../entities/Comment";
import { getUserId } from "../utils/auth";
import { getCardAccess, getCommentAccess } from "../utils/access";
import { forbidden } from "../utils/HttpError";
import { serializeComment } from "../utils/serializers";

const router = Router();

const commentSchema = z.object({
  content: z
    .string({ error: "Escreva um comentário" })
    .trim()
    .min(1, "Escreva um comentário")
    .max(5000, "O comentário deve ter no máximo 5000 caracteres"),
});

/** Comment history of a card, oldest first. */
router.get("/cards/:cardId/comments", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));
  const comments = await AppDataSource.getRepository(Comment).find({
    where: { cardId: card.id },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });
  res.json({ comments: comments.map(serializeComment) });
});

router.post("/cards/:cardId/comments", async (req, res) => {
  const userId = getUserId(res);
  const { card } = await getCardAccess(req.params.cardId, userId);
  const { content } = commentSchema.parse(req.body);

  const comments = AppDataSource.getRepository(Comment);
  const comment = await comments.save(
    comments.create({ cardId: card.id, authorId: userId, content }),
  );
  const saved = await comments.findOneOrFail({
    where: { id: comment.id },
    relations: { author: true },
  });

  res.status(201).json({ comment: serializeComment(saved) });
});

router.patch("/comments/:commentId", async (req, res) => {
  const userId = getUserId(res);
  const { comment } = await getCommentAccess(req.params.commentId, userId);
  if (comment.authorId !== userId) {
    throw forbidden("Apenas o autor pode editar o comentário");
  }
  const { content } = commentSchema.parse(req.body);

  if (content !== comment.content) {
    comment.content = content;
    comment.editedAt = new Date();
    await AppDataSource.getRepository(Comment).save(comment);
  }

  res.json({ comment: serializeComment(comment) });
});

router.delete("/comments/:commentId", async (req, res) => {
  const userId = getUserId(res);
  const { comment, membership } = await getCommentAccess(
    req.params.commentId,
    userId,
  );
  if (comment.authorId !== userId && membership.role !== "admin") {
    throw forbidden(
      "Apenas o autor ou um administrador pode excluir o comentário",
    );
  }

  await AppDataSource.getRepository(Comment).delete({ id: comment.id });
  res.status(204).send();
});

export default router;
