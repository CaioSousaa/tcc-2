import type { Request, Response } from "express";
import { z } from "zod";
import { requireCardAccess, requireCommentAccess } from "../services/access";
import { commentRepo } from "../services/repositories";
import { serializeComment } from "../services/serializers";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const contentSchema = z.object({
  content: z
    .string({ message: "Comentário é obrigatório" })
    .trim()
    .min(1, "Comentário não pode ser vazio")
    .max(5000, "Comentário muito longo"),
});

async function loadComment(commentId: string) {
  const comment = await commentRepo().findOne({
    where: { id: commentId },
    relations: { author: true },
  });
  if (!comment) {
    throw new AppError(404, "Comentário não encontrado", "NOT_FOUND");
  }
  return serializeComment(comment);
}

export async function listComments(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const comments = await commentRepo().find({
    where: { cardId: card.id },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });
  return res.json({ comments: comments.map(serializeComment) });
}

export async function createComment(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const data = parseBody(contentSchema, req.body);

  const comment = await commentRepo().save(
    commentRepo().create({
      content: data.content,
      cardId: card.id,
      authorId: req.userId,
    }),
  );
  return res.status(201).json({ comment: await loadComment(comment.id) });
}

export async function updateComment(req: Request, res: Response) {
  const { comment } = await requireCommentAccess(
    String(req.params.commentId),
    req.userId,
  );
  if (comment.authorId !== req.userId) {
    throw new AppError(
      403,
      "Apenas o autor pode editar o comentário",
      "FORBIDDEN",
    );
  }
  const data = parseBody(contentSchema, req.body);

  comment.content = data.content;
  await commentRepo().save(comment);
  return res.json({ comment: await loadComment(comment.id) });
}

export async function deleteComment(req: Request, res: Response) {
  const { comment, isAdmin } = await requireCommentAccess(
    String(req.params.commentId),
    req.userId,
  );
  if (comment.authorId !== req.userId && !isAdmin) {
    throw new AppError(
      403,
      "Apenas o autor ou um administrador pode excluir o comentário",
      "FORBIDDEN",
    );
  }
  await commentRepo().delete({ id: comment.id });
  return res.status(204).send();
}
