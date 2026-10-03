import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./cards.service";

export const cardsRouter = Router();
cardsRouter.use(authenticate);

const dueDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data de vencimento inválida")
  .nullish();

const createSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do card").max(200),
  description: z.string().trim().max(5000).nullish(),
  dueDate: dueDateSchema,
});

const updateSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do card").max(200).optional(),
  description: z.string().trim().max(5000).nullish(),
  dueDate: dueDateSchema,
});

cardsRouter.post(
  "/lists/:id/cards",
  boardAccess("list"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    res.status(201).json(await service.createCard(String(req.params.id), data));
  }),
);

cardsRouter.get(
  "/cards/:id",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    res.json(await service.getCardDetail(String(req.params.id)));
  }),
);

cardsRouter.patch(
  "/cards/:id",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    res.json(await service.updateCard(String(req.params.id), data));
  }),
);

cardsRouter.patch(
  "/cards/:id/move",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const { listId, position } = z
      .object({ listId: z.string().uuid(), position: z.number().int().min(0) })
      .parse(req.body);
    await service.moveCard(req.boardId, String(req.params.id), listId, position);
    res.status(204).send();
  }),
);

cardsRouter.delete(
  "/cards/:id",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    await service.deleteCard(String(req.params.id));
    res.status(204).send();
  }),
);

cardsRouter.put(
  "/cards/:id/assignees",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const { userIds } = z
      .object({ userIds: z.array(z.string().uuid()) })
      .parse(req.body);
    res.json(await service.setAssignees(req.boardId, String(req.params.id), userIds));
  }),
);

cardsRouter.put(
  "/cards/:id/labels",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const { labelIds } = z
      .object({ labelIds: z.array(z.string().uuid()) })
      .parse(req.body);
    res.json(await service.setLabels(req.boardId, String(req.params.id), labelIds));
  }),
);
