import type { Request, Response } from "express";
import { z } from "zod";
import {
  requireCardAccess,
  requireChecklistAccess,
  requireChecklistItemAccess,
} from "../services/access";
import { checklistItemRepo, checklistRepo } from "../services/repositories";
import { serializeChecklist } from "../services/serializers";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const checklistTitleSchema = z
  .string({ message: "Título é obrigatório" })
  .trim()
  .min(1, "Título é obrigatório")
  .max(120, "Título muito longo");

const itemContentSchema = z
  .string({ message: "Descrição do item é obrigatória" })
  .trim()
  .min(1, "Descrição do item é obrigatória")
  .max(255, "Descrição do item muito longa");

const createChecklistSchema = z.object({ title: checklistTitleSchema });
const updateChecklistSchema = z.object({ title: checklistTitleSchema });
const createItemSchema = z.object({ content: itemContentSchema });
const updateItemSchema = z.object({
  content: itemContentSchema.optional(),
  done: z.boolean().optional(),
});

async function loadChecklist(checklistId: string) {
  const checklist = await checklistRepo().findOne({
    where: { id: checklistId },
    relations: { items: true },
  });
  if (!checklist) {
    throw new AppError(404, "Checklist não encontrada", "NOT_FOUND");
  }
  return serializeChecklist(checklist);
}

export async function createChecklist(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const data = parseBody(createChecklistSchema, req.body);

  const position = await checklistRepo().countBy({ cardId: card.id });
  const checklist = await checklistRepo().save(
    checklistRepo().create({ title: data.title, cardId: card.id, position }),
  );

  return res.status(201).json({ checklist: await loadChecklist(checklist.id) });
}

export async function updateChecklist(req: Request, res: Response) {
  const { checklist } = await requireChecklistAccess(
    String(req.params.checklistId),
    req.userId,
  );
  const data = parseBody(updateChecklistSchema, req.body);

  await checklistRepo().update({ id: checklist.id }, { title: data.title });
  return res.json({ checklist: await loadChecklist(checklist.id) });
}

export async function deleteChecklist(req: Request, res: Response) {
  const { checklist } = await requireChecklistAccess(
    String(req.params.checklistId),
    req.userId,
  );
  await checklistRepo().delete({ id: checklist.id });
  return res.status(204).send();
}

export async function createChecklistItem(req: Request, res: Response) {
  const { checklist } = await requireChecklistAccess(
    String(req.params.checklistId),
    req.userId,
  );
  const data = parseBody(createItemSchema, req.body);

  const position = await checklistItemRepo().countBy({
    checklistId: checklist.id,
  });
  await checklistItemRepo().save(
    checklistItemRepo().create({
      content: data.content,
      checklistId: checklist.id,
      position,
    }),
  );

  return res.status(201).json({ checklist: await loadChecklist(checklist.id) });
}

export async function updateChecklistItem(req: Request, res: Response) {
  const { item, checklist } = await requireChecklistItemAccess(
    String(req.params.itemId),
    req.userId,
  );
  const data = parseBody(updateItemSchema, req.body);

  const changes: { content?: string; done?: boolean } = {};
  if (data.content !== undefined) changes.content = data.content;
  if (data.done !== undefined) changes.done = data.done;
  if (Object.keys(changes).length > 0) {
    await checklistItemRepo().update({ id: item.id }, changes);
  }

  return res.json({ checklist: await loadChecklist(checklist.id) });
}

export async function deleteChecklistItem(req: Request, res: Response) {
  const { item, checklist } = await requireChecklistItemAccess(
    String(req.params.itemId),
    req.userId,
  );
  await checklistItemRepo().delete({ id: item.id });
  return res.json({ checklist: await loadChecklist(checklist.id) });
}
