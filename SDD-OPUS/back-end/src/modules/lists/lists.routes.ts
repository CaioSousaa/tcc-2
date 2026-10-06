import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import {
  createListSchema,
  deleteListQuerySchema,
  moveListSchema,
  renameListSchema,
} from "./lists.schemas";
import * as lists from "./lists.service";

export const listsRouter = Router();

listsRouter.post("/boards/:boardId/lists", async (req, res) => {
  const { name } = parse(createListSchema, req.body);
  res.status(201).json(await lists.createList(idParam(req, "boardId"), authOf(req).user.id, name));
});

listsRouter.patch("/lists/:listId", async (req, res) => {
  const { name } = parse(renameListSchema, req.body);
  res.json(await lists.renameList(idParam(req, "listId"), authOf(req).user.id, name));
});

listsRouter.post("/lists/:listId/move", async (req, res) => {
  const { position } = parse(moveListSchema, req.body);
  res.json(await lists.moveList(idParam(req, "listId"), authOf(req).user.id, position));
});

listsRouter.delete("/lists/:listId", async (req, res) => {
  const { confirmCards } = parse(deleteListQuerySchema, req.query);
  await lists.deleteList(idParam(req, "listId"), authOf(req).user.id, confirmCards);
  res.status(204).end();
});
