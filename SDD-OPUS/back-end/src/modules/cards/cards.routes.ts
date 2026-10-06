import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { getCardDetail } from "./cardDetail.service";
import { createCardSchema, moveCardSchema, updateCardSchema } from "./cards.schemas";
import * as cards from "./cards.service";

export const cardsRouter = Router();

cardsRouter.post("/lists/:listId/cards", async (req, res) => {
  const input = parse(createCardSchema, req.body);
  res.status(201).json(await cards.createCard(idParam(req, "listId"), authOf(req).user.id, input));
});

cardsRouter.get("/cards/:cardId", async (req, res) => {
  res.json(await getCardDetail(idParam(req, "cardId"), authOf(req).user.id));
});

cardsRouter.patch("/cards/:cardId", async (req, res) => {
  const input = parse(updateCardSchema, req.body);
  const cardId = idParam(req, "cardId");
  const userId = authOf(req).user.id;
  await cards.updateCardFields(cardId, userId, input);
  res.json(await getCardDetail(cardId, userId));
});

cardsRouter.post("/cards/:cardId/move", async (req, res) => {
  const input = parse(moveCardSchema, req.body);
  res.json(await cards.moveCard(idParam(req, "cardId"), authOf(req).user.id, input));
});

cardsRouter.delete("/cards/:cardId", async (req, res) => {
  await cards.deleteCard(idParam(req, "cardId"), authOf(req).user.id);
  res.status(204).end();
});
