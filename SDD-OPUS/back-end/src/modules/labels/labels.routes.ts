import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { createLabelSchema, updateLabelSchema } from "./labels.schemas";
import * as labels from "./labels.service";

export const labelsRouter = Router();

labelsRouter.post("/boards/:boardId/labels", async (req, res) => {
  const input = parse(createLabelSchema, req.body);
  res.status(201).json(await labels.createLabel(idParam(req, "boardId"), authOf(req).user.id, input));
});

labelsRouter.patch("/labels/:labelId", async (req, res) => {
  const input = parse(updateLabelSchema, req.body);
  res.json(await labels.updateLabel(idParam(req, "labelId"), authOf(req).user.id, input));
});

labelsRouter.delete("/labels/:labelId", async (req, res) => {
  await labels.deleteLabel(idParam(req, "labelId"), authOf(req).user.id);
  res.status(204).end();
});

labelsRouter.put("/cards/:cardId/labels/:labelId", async (req, res) => {
  await labels.applyLabel(idParam(req, "cardId"), idParam(req, "labelId"), authOf(req).user.id);
  res.status(204).end();
});

labelsRouter.delete("/cards/:cardId/labels/:labelId", async (req, res) => {
  await labels.removeLabelFromCard(idParam(req, "cardId"), idParam(req, "labelId"), authOf(req).user.id);
  res.status(204).end();
});
