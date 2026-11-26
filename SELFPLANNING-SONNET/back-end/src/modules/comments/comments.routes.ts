import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./comments.service";

export const commentsRouter = Router();
commentsRouter.use(authenticate);

commentsRouter.get(
  "/cards/:id/comments",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    res.json(await service.listComments(String(req.params.id)));
  }),
);

commentsRouter.post(
  "/cards/:id/comments",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const { content } = z
      .object({
        content: z.string().trim().min(1, "Escreva um comentário").max(2000),
      })
      .parse(req.body);
    res
      .status(201)
      .json(await service.createComment(String(req.params.id), req.userId, content));
  }),
);

commentsRouter.delete(
  "/comments/:id",
  boardAccess("comment"),
  asyncHandler(async (req, res) => {
    await service.deleteComment(String(req.params.id), req.userId, req.boardRole);
    res.status(204).send();
  }),
);
