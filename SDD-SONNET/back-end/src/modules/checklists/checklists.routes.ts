import { Router, type Request } from "express";
import { currentUser } from "../auth/auth.middleware";
import { checklistBodySchema, itemCreateSchema, itemUpdateSchema } from "./checklists.schemas";
import * as service from "./checklists.service";

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string>)[name]);
}

/** `POST /cards/:cardId/checklists`. */
export const cardChecklistsRouter = Router({ mergeParams: true });

cardChecklistsRouter.post("/", async (req, res) => {
  const { title } = checklistBodySchema.parse(req.body);
  res.status(201).json(await service.createChecklist(currentUser(req).id, param(req, "cardId"), title));
});

/** `/checklists/:checklistId` e itens. */
export const checklistsRouter = Router();

checklistsRouter.patch("/:checklistId", async (req, res) => {
  const { title } = checklistBodySchema.parse(req.body);
  res.json(await service.renameChecklist(currentUser(req).id, param(req, "checklistId"), title));
});

checklistsRouter.delete("/:checklistId", async (req, res) => {
  res.json(await service.deleteChecklist(currentUser(req).id, param(req, "checklistId")));
});

checklistsRouter.post("/:checklistId/items", async (req, res) => {
  const { text } = itemCreateSchema.parse(req.body);
  res.status(201).json(await service.addItem(currentUser(req).id, param(req, "checklistId"), text));
});

/** `/checklist-items/:itemId`. */
export const checklistItemsRouter = Router();

checklistItemsRouter.patch("/:itemId", async (req, res) => {
  const patch = itemUpdateSchema.parse(req.body);
  res.json(await service.updateItem(currentUser(req).id, param(req, "itemId"), patch));
});

checklistItemsRouter.delete("/:itemId", async (req, res) => {
  res.json(await service.deleteItem(currentUser(req).id, param(req, "itemId")));
});
