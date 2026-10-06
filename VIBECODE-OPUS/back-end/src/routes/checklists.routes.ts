import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";
import { getUserId } from "../utils/auth";
import {
  getCardAccess,
  getChecklistAccess,
  getChecklistItemAccess,
} from "../utils/access";
import { serializeChecklist } from "../utils/serializers";

const router = Router();

const checklistTitleSchema = z
  .string({ error: "Informe o título do checklist" })
  .trim()
  .min(1, "Informe o título do checklist")
  .max(120, "O título deve ter no máximo 120 caracteres");

const itemTextSchema = z
  .string({ error: "Informe o texto do item" })
  .trim()
  .min(1, "Informe o texto do item")
  .max(255, "O item deve ter no máximo 255 caracteres");

const checklistSchema = z.object({ title: checklistTitleSchema });
const createItemSchema = z.object({ text: itemTextSchema });
const updateItemSchema = z.object({
  text: itemTextSchema.optional(),
  done: z.boolean().optional(),
});

async function loadChecklist(id: string) {
  const checklist = await AppDataSource.getRepository(Checklist).findOneOrFail({
    where: { id },
    relations: { items: true },
  });
  return serializeChecklist(checklist);
}

router.post("/cards/:cardId/checklists", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));
  const { title } = checklistSchema.parse(req.body);

  const checklists = AppDataSource.getRepository(Checklist);
  const position = await checklists.countBy({ cardId: card.id });
  const checklist = await checklists.save(
    checklists.create({ cardId: card.id, title, position }),
  );

  res.status(201).json({ checklist: await loadChecklist(checklist.id) });
});

router.patch("/checklists/:checklistId", async (req, res) => {
  const { checklist } = await getChecklistAccess(
    req.params.checklistId,
    getUserId(res),
  );
  const { title } = checklistSchema.parse(req.body);

  await AppDataSource.getRepository(Checklist).update(
    { id: checklist.id },
    { title },
  );
  res.json({ checklist: await loadChecklist(checklist.id) });
});

router.delete("/checklists/:checklistId", async (req, res) => {
  const { checklist } = await getChecklistAccess(
    req.params.checklistId,
    getUserId(res),
  );
  await AppDataSource.getRepository(Checklist).delete({ id: checklist.id });
  res.status(204).send();
});

router.post("/checklists/:checklistId/items", async (req, res) => {
  const { checklist } = await getChecklistAccess(
    req.params.checklistId,
    getUserId(res),
  );
  const { text } = createItemSchema.parse(req.body);

  const items = AppDataSource.getRepository(ChecklistItem);
  const position = await items.countBy({ checklistId: checklist.id });
  await items.save(items.create({ checklistId: checklist.id, text, position }));

  res.status(201).json({ checklist: await loadChecklist(checklist.id) });
});

router.patch("/checklist-items/:itemId", async (req, res) => {
  const { item } = await getChecklistItemAccess(
    req.params.itemId,
    getUserId(res),
  );
  const data = updateItemSchema.parse(req.body);

  const changes: Partial<ChecklistItem> = {};
  if (data.text !== undefined) changes.text = data.text;
  if (data.done !== undefined) changes.done = data.done;
  if (Object.keys(changes).length > 0) {
    await AppDataSource.getRepository(ChecklistItem).update(
      { id: item.id },
      changes,
    );
  }

  res.json({ checklist: await loadChecklist(item.checklistId) });
});

router.delete("/checklist-items/:itemId", async (req, res) => {
  const { item } = await getChecklistItemAccess(
    req.params.itemId,
    getUserId(res),
  );
  await AppDataSource.getRepository(ChecklistItem).delete({ id: item.id });
  res.json({ checklist: await loadChecklist(item.checklistId) });
});

export default router;
