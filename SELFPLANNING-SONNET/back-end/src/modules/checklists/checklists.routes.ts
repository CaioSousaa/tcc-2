import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { boardAccess } from "../../middlewares/boardAccess";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./checklists.service";

export const checklistsRouter = Router();
checklistsRouter.use(authenticate);

const titleSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da checklist").max(200),
});
const textSchema = z.object({
  text: z.string().trim().min(1, "Informe o texto do item").max(300),
});

checklistsRouter.post(
  "/cards/:id/checklists",
  boardAccess("card"),
  asyncHandler(async (req, res) => {
    const { title } = titleSchema.parse(req.body);
    res.status(201).json(await service.createChecklist(String(req.params.id), title));
  }),
);

checklistsRouter.patch(
  "/checklists/:id",
  boardAccess("checklist"),
  asyncHandler(async (req, res) => {
    const { title } = titleSchema.parse(req.body);
    res.json(await service.renameChecklist(String(req.params.id), title));
  }),
);

checklistsRouter.delete(
  "/checklists/:id",
  boardAccess("checklist"),
  asyncHandler(async (req, res) => {
    res.json(await service.deleteChecklist(String(req.params.id)));
  }),
);

checklistsRouter.post(
  "/checklists/:id/items",
  boardAccess("checklist"),
  asyncHandler(async (req, res) => {
    const { text } = textSchema.parse(req.body);
    res.status(201).json(await service.createItem(String(req.params.id), text));
  }),
);

checklistsRouter.patch(
  "/items/:id",
  boardAccess("item"),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        text: textSchema.shape.text.optional(),
        done: z.boolean().optional(),
      })
      .parse(req.body);
    res.json(await service.updateItem(String(req.params.id), data));
  }),
);

checklistsRouter.delete(
  "/items/:id",
  boardAccess("item"),
  asyncHandler(async (req, res) => {
    res.json(await service.deleteItem(String(req.params.id)));
  }),
);
