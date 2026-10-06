import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { listCardsRouter } from "../cards/cards.routes";
import { deleteListQuerySchema, listBodySchema, moveListSchema } from "./lists.schemas";
import * as service from "./lists.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** Rotas aninhadas em `/boards/:boardId/lists`. */
export const boardListsRouter = Router({ mergeParams: true });

boardListsRouter.post("/", async (req, res) => {
  const { name } = listBodySchema.parse(req.body);
  res.status(201).json(await service.createList(currentUser(req).id, param(req, "boardId"), name));
});

/** Rotas planas em `/lists/:listId`. */
export const listsRouter = Router();
listsRouter.use("/:listId/cards", listCardsRouter);

listsRouter.patch("/:listId", async (req, res) => {
  const { name } = listBodySchema.parse(req.body);
  res.json(await service.renameList(currentUser(req).id, param(req, "listId"), name));
});

listsRouter.post("/:listId/move", async (req, res) => {
  const { position } = moveListSchema.parse(req.body);
  res.json(await service.moveList(currentUser(req).id, param(req, "listId"), position));
});

listsRouter.delete("/:listId", async (req, res) => {
  const query = deleteListQuerySchema.parse(req.query);
  const result = await service.deleteList(currentUser(req).id, param(req, "listId"), query);
  if (query.strategy === "move" && result.movedCount > 0) {
    res.json(result);
    return;
  }
  res.status(204).end();
});
