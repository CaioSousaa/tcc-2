import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./lists.service";

export const listsRouter = Router();
listsRouter.use(authenticate);

const nameSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da lista").max(100),
});

listsRouter.post(
  "/boards/:id/lists",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { name } = nameSchema.parse(req.body);
    res.status(201).json(await service.createList(req.boardId, name));
  }),
);

listsRouter.patch(
  "/lists/:id",
  boardAccess("list", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { name } = nameSchema.parse(req.body);
    res.json(await service.renameList(String(req.params.id), name));
  }),
);

listsRouter.patch(
  "/lists/:id/move",
  boardAccess("list", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { position } = z
      .object({ position: z.number().int().min(0) })
      .parse(req.body);
    await service.moveList(req.boardId, String(req.params.id), position);
    res.status(204).send();
  }),
);

listsRouter.delete(
  "/lists/:id",
  boardAccess("list", "ADMIN"),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        strategy: z.enum(["delete", "move"]).optional(),
        targetListId: z.string().uuid().optional(),
      })
      .parse(req.query);
    await service.deleteList(
      req.boardId,
      String(req.params.id),
      query.strategy,
      query.targetListId,
    );
    res.status(204).send();
  }),
);
