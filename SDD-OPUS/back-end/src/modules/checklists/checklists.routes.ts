import { Router } from "express";
import { idParam } from "../../shared/http/params";
import { parse } from "../../shared/http/validate";
import { authOf } from "../auth/auth.middleware";
import { checklistTitleSchema, createItemSchema, updateItemSchema } from "./checklists.schemas";
import * as checklists from "./checklists.service";

export const checklistsRouter = Router();

checklistsRouter.post("/cards/:cardId/checklists", async (req, res) => {
  const { title } = parse(checklistTitleSchema, req.body);
  res.status(201).json(await checklists.createChecklist(idParam(req, "cardId"), authOf(req).user.id, title));
});

checklistsRouter.patch("/checklists/:checklistId", async (req, res) => {
  const { title } = parse(checklistTitleSchema, req.body);
  res.json(await checklists.renameChecklist(idParam(req, "checklistId"), authOf(req).user.id, title));
});

checklistsRouter.delete("/checklists/:checklistId", async (req, res) => {
  const progress = await checklists.deleteChecklist(idParam(req, "checklistId"), authOf(req).user.id);
  res.json({ progress });
});

checklistsRouter.post("/checklists/:checklistId/items", async (req, res) => {
  const { text } = parse(createItemSchema, req.body);
  res.status(201).json(await checklists.createItem(idParam(req, "checklistId"), authOf(req).user.id, text));
});

checklistsRouter.patch("/checklist-items/:itemId", async (req, res) => {
  const input = parse(updateItemSchema, req.body);
  res.json(await checklists.updateItem(idParam(req, "itemId"), authOf(req).user.id, input));
});

checklistsRouter.delete("/checklist-items/:itemId", async (req, res) => {
  const progress = await checklists.deleteItem(idParam(req, "itemId"), authOf(req).user.id);
  res.json({ progress });
});
