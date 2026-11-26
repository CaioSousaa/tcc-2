import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { createLabelSchema, updateLabelSchema } from "./labels.schemas";
import * as service from "./labels.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** `POST /boards/:boardId/labels`. */
export const boardLabelsRouter = Router({ mergeParams: true });

boardLabelsRouter.post("/", async (req, res) => {
  const input = createLabelSchema.parse(req.body);
  res.status(201).json(await service.createLabel(currentUser(req).id, param(req, "boardId"), input));
});

/** `/labels/:labelId`. */
export const labelsRouter = Router();

labelsRouter.patch("/:labelId", async (req, res) => {
  const patch = updateLabelSchema.parse(req.body);
  res.json(await service.updateLabel(currentUser(req).id, param(req, "labelId"), patch));
});

labelsRouter.delete("/:labelId", async (req, res) => {
  await service.deleteLabel(currentUser(req).id, param(req, "labelId"));
  res.status(204).end();
});

/** `PUT|DELETE /cards/:cardId/labels/:labelId`. */
export const cardLabelsRouter = Router({ mergeParams: true });

cardLabelsRouter.put("/:labelId", async (req, res) => {
  await service.applyLabel(currentUser(req).id, param(req, "cardId"), param(req, "labelId"));
  res.status(204).end();
});

cardLabelsRouter.delete("/:labelId", async (req, res) => {
  await service.removeLabelFromCard(
    currentUser(req).id,
    param(req, "cardId"),
    param(req, "labelId"),
  );
  res.status(204).end();
});
