import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { cardAssigneesRouter } from "../assignees/assignees.routes";
import { cardCommentsRouter } from "../comments/comments.routes";
import { cardLabelsRouter } from "../labels/labels.routes";
import { cardChecklistsRouter } from "../checklists/checklists.routes";
import { createCardSchema, moveCardSchema, updateCardSchema } from "./cards.schemas";
import * as service from "./cards.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** Rotas aninhadas em `/lists/:listId/cards`. */
export const listCardsRouter = Router({ mergeParams: true });

listCardsRouter.post("/", async (req, res) => {
  const input = createCardSchema.parse(req.body);
  res.status(201).json(await service.createCard(currentUser(req).id, param(req, "listId"), input));
});

/** Rotas planas em `/cards/:cardId`. */
export const cardsRouter = Router();
cardsRouter.use("/:cardId/checklists", cardChecklistsRouter);
cardsRouter.use("/:cardId/labels", cardLabelsRouter);
cardsRouter.use("/:cardId/assignees", cardAssigneesRouter);
cardsRouter.use("/:cardId/comments", cardCommentsRouter);

cardsRouter.get("/:cardId", async (req, res) => {
  res.json(await service.getCard(currentUser(req).id, param(req, "cardId")));
});

cardsRouter.patch("/:cardId", async (req, res) => {
  const patch = updateCardSchema.parse(req.body);
  res.json(await service.updateCard(currentUser(req).id, param(req, "cardId"), patch));
});

cardsRouter.post("/:cardId/move", async (req, res) => {
  const target = moveCardSchema.parse(req.body);
  res.json(await service.moveCard(currentUser(req).id, param(req, "cardId"), target));
});

cardsRouter.delete("/:cardId", async (req, res) => {
  await service.deleteCard(currentUser(req).id, param(req, "cardId"));
  res.status(204).end();
});
