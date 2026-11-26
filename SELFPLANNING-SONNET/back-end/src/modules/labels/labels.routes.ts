import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./labels.service";

export const labelsRouter = Router();
labelsRouter.use(authenticate);

const nameSchema = z.string().trim().min(1, "Informe o nome da etiqueta").max(40);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

labelsRouter.get(
  "/boards/:id/labels",
  boardAccess("board"),
  asyncHandler(async (req, res) => {
    res.json(await service.listLabels(req.boardId));
  }),
);

labelsRouter.post(
  "/boards/:id/labels",
  boardAccess("board", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = z.object({ name: nameSchema, color: colorSchema }).parse(req.body);
    res.status(201).json(await service.createLabel(req.boardId, data));
  }),
);

labelsRouter.patch(
  "/labels/:id",
  boardAccess("label", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = z
      .object({ name: nameSchema.optional(), color: colorSchema.optional() })
      .parse(req.body);
    res.json(await service.updateLabel(String(req.params.id), data));
  }),
);

labelsRouter.delete(
  "/labels/:id",
  boardAccess("label", "ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteLabel(String(req.params.id));
    res.status(204).send();
  }),
);
