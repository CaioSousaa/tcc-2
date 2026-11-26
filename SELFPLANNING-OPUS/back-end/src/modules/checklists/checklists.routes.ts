import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { Checklist } from "../../entities/Checklist";
import { ChecklistItem } from "../../entities/ChecklistItem";
import { notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { persistOrder } from "../../utils/positions";
import { idParam } from "../../utils/validate";
import { serializeChecklist } from "../serializers";

const checklistTitle = z.string().trim().min(1, "Informe o título do checklist").max(120);
const itemContent = z.string().trim().min(1, "Informe o texto do item").max(300);

const updateChecklistSchema = z.object({ title: checklistTitle });
const createItemSchema = z.object({ content: itemContent });
const updateItemSchema = z
  .object({ content: itemContent, done: z.boolean() })
  .partial();

const checklists = () => AppDataSource.getRepository(Checklist);
const items = () => AppDataSource.getRepository(ChecklistItem);

async function findChecklistInBoard(boardId: string, checklistId: string) {
  const checklist = await checklists().findOne({
    where: { id: checklistId, card: { list: { boardId } } },
  });
  if (!checklist) {
    throw notFound("Checklist não encontrado");
  }
  return checklist;
}

async function findItemInBoard(boardId: string, itemId: string) {
  const item = await items().findOne({
    where: { id: itemId, checklist: { card: { list: { boardId } } } },
  });
  if (!item) {
    throw notFound("Item do checklist não encontrado");
  }
  return item;
}

async function loadChecklist(checklistId: string) {
  const checklist = await checklists().findOneOrFail({
    where: { id: checklistId },
    relations: { items: true },
  });
  return serializeChecklist(checklist);
}

/** Rotas montadas em /boards/:boardId/checklists */
export const checklistsRoutes = Router({ mergeParams: true });

checklistsRoutes.patch("/:checklistId", requireBoardRole("editor"), async (req, res) => {
  const { title } = updateChecklistSchema.parse(req.body);
  const checklist = await findChecklistInBoard(
    req.membership.boardId,
    idParam(req, "checklistId"),
  );

  await checklists().update({ id: checklist.id }, { title });
  res.json(await loadChecklist(checklist.id));
});

checklistsRoutes.delete("/:checklistId", requireBoardRole("editor"), async (req, res) => {
  const checklist = await findChecklistInBoard(
    req.membership.boardId,
    idParam(req, "checklistId"),
  );

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(Checklist, { id: checklist.id });
    const siblings = await manager.find(Checklist, {
      where: { cardId: checklist.cardId },
      order: { position: "ASC" },
    });
    await persistOrder(manager, Checklist, siblings);
  });

  res.status(204).send();
});

checklistsRoutes.post("/:checklistId/items", requireBoardRole("editor"), async (req, res) => {
  const { content } = createItemSchema.parse(req.body);
  const checklist = await findChecklistInBoard(
    req.membership.boardId,
    idParam(req, "checklistId"),
  );

  await items().save(
    items().create({
      content,
      done: false,
      checklistId: checklist.id,
      position: await items().countBy({ checklistId: checklist.id }),
    }),
  );

  res.status(201).json(await loadChecklist(checklist.id));
});

/** Rotas montadas em /boards/:boardId/checklist-items */
export const checklistItemsRoutes = Router({ mergeParams: true });

checklistItemsRoutes.patch("/:itemId", requireBoardRole("editor"), async (req, res) => {
  const data = updateItemSchema.parse(req.body);
  const item = await findItemInBoard(req.membership.boardId, idParam(req, "itemId"));

  if (Object.keys(data).length > 0) {
    await items().update({ id: item.id }, data);
  }
  res.json(await loadChecklist(item.checklistId));
});

checklistItemsRoutes.delete("/:itemId", requireBoardRole("editor"), async (req, res) => {
  const item = await findItemInBoard(req.membership.boardId, idParam(req, "itemId"));

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(ChecklistItem, { id: item.id });
    const siblings = await manager.find(ChecklistItem, {
      where: { checklistId: item.checklistId },
      order: { position: "ASC" },
    });
    await persistOrder(manager, ChecklistItem, siblings);
  });

  res.json(await loadChecklist(item.checklistId));
});
