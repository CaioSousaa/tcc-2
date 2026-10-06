import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { BoardMember } from "../entities/BoardMember";
import { Card } from "../entities/Card";
import { Comment } from "../entities/Comment";
import { Label } from "../entities/Label";
import { List } from "../entities/List";
import { getUserId } from "../utils/auth";
import { assertUuid, getCardAccess, getListAccess } from "../utils/access";
import { badRequest, forbidden, notFound } from "../utils/HttpError";
import { persistOrder } from "../utils/positions";
import {
  publicUser,
  serializeCardSummary,
  serializeChecklist,
  serializeComment,
  serializeLabel,
} from "../utils/serializers";
import { uuidSchema } from "../utils/schemas";

const router = Router();

const titleSchema = z
  .string({ error: "Informe o título do card" })
  .trim()
  .min(1, "Informe o título do card")
  .max(200, "O título deve ter no máximo 200 caracteres");

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "A descrição deve ter no máximo 5000 caracteres")
  .nullish();

const dueDateSchema = z.iso
  .datetime({ offset: true, error: "Data de vencimento inválida" })
  .nullish();

const createCardSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  dueDate: dueDateSchema,
});

const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  dueDate: dueDateSchema,
  completed: z.boolean().optional(),
});

const moveCardSchema = z.object({
  listId: uuidSchema,
  position: z.number().int().min(0, "Posição inválida"),
});

async function loadCardDetail(cardId: string) {
  const card = await AppDataSource.getRepository(Card).findOneOrFail({
    where: { id: cardId },
    relations: {
      list: true,
      labels: true,
      assignees: true,
      checklists: { items: true },
    },
  });
  const comments = await AppDataSource.getRepository(Comment).find({
    where: { cardId },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });

  return {
    ...serializeCardSummary(card, comments.length),
    listTitle: card.list.title,
    labels: card.labels.map(serializeLabel),
    assignees: card.assignees.map(publicUser),
    checklists: [...card.checklists]
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map(serializeChecklist),
    comments: comments.map(serializeComment),
  };
}

router.post("/lists/:listId/cards", async (req, res) => {
  const { list } = await getListAccess(req.params.listId, getUserId(res));
  const data = createCardSchema.parse(req.body);

  const cards = AppDataSource.getRepository(Card);
  const position = await cards.countBy({ listId: list.id });
  const card = await cards.save(
    cards.create({
      boardId: list.boardId,
      listId: list.id,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      position,
    }),
  );

  res.status(201).json({ card: await loadCardDetail(card.id) });
});

router.get("/cards/:cardId", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));
  res.json({ card: await loadCardDetail(card.id) });
});

router.patch("/cards/:cardId", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));
  const data = updateCardSchema.parse(req.body);

  if (data.title !== undefined) card.title = data.title;
  if (data.description !== undefined) card.description = data.description || null;
  if (data.dueDate !== undefined) {
    card.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.completed !== undefined) card.completed = data.completed;
  await AppDataSource.getRepository(Card).save(card);

  res.json({ card: await loadCardDetail(card.id) });
});

/** Moves a card to `position` of `listId` (same list or another list of the board). */
router.patch("/cards/:cardId/move", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));
  const { listId, position } = moveCardSchema.parse(req.body);

  await AppDataSource.transaction(async (manager) => {
    const target = await manager.findOneBy(List, {
      id: listId,
      boardId: card.boardId,
    });
    if (!target) {
      throw badRequest("A lista de destino não pertence a este quadro");
    }

    const sourceId = card.listId;
    const targetCards = (
      await manager.find(Card, {
        where: { listId: target.id },
        order: { position: "ASC", createdAt: "ASC" },
      })
    ).filter((item) => item.id !== card.id);

    const index = Math.min(position, targetCards.length);
    const moving = await manager.findOneByOrFail(Card, { id: card.id });
    targetCards.splice(index, 0, moving);

    if (sourceId !== target.id) {
      await manager.update(Card, { id: card.id }, { listId: target.id });
      const sourceCards = await manager.find(Card, {
        where: { listId: sourceId },
        order: { position: "ASC", createdAt: "ASC" },
      });
      await persistOrder(manager, Card, sourceCards);
    }

    // Force the moved card to be rewritten even if its index did not change.
    moving.position = -1;
    await persistOrder(manager, Card, targetCards);
  });

  res.json({ card: await loadCardDetail(card.id) });
});

router.delete("/cards/:cardId", async (req, res) => {
  const { card } = await getCardAccess(req.params.cardId, getUserId(res));

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(Card, { id: card.id });
    const siblings = await manager.find(Card, {
      where: { listId: card.listId },
      order: { position: "ASC", createdAt: "ASC" },
    });
    await persistOrder(manager, Card, siblings);
  });

  res.status(204).send();
});

/* -------------------------------- Labels --------------------------------- */

async function setCardLabel(cardIdParam: unknown, labelIdParam: unknown, userId: string, attach: boolean) {
  const { card } = await getCardAccess(cardIdParam, userId);
  const labelId = assertUuid(labelIdParam, "Etiqueta não encontrada");
  const label = await AppDataSource.getRepository(Label).findOneBy({
    id: labelId,
    boardId: card.boardId,
  });
  if (!label) throw notFound("Etiqueta não encontrada neste quadro");

  const relation = AppDataSource.createQueryBuilder()
    .relation(Card, "labels")
    .of(card.id);
  const attached = await AppDataSource.getRepository(Card).exists({
    where: { id: card.id, labels: { id: label.id } },
  });

  if (attach && !attached) await relation.add(label.id);
  if (!attach && attached) await relation.remove(label.id);
  return card.id;
}

router.put("/cards/:cardId/labels/:labelId", async (req, res) => {
  const cardId = await setCardLabel(req.params.cardId, req.params.labelId, getUserId(res), true);
  res.json({ card: await loadCardDetail(cardId) });
});

router.delete("/cards/:cardId/labels/:labelId", async (req, res) => {
  const cardId = await setCardLabel(req.params.cardId, req.params.labelId, getUserId(res), false);
  res.json({ card: await loadCardDetail(cardId) });
});

/* ------------------------------- Assignees ------------------------------- */

/**
 * Admins can assign any board member to a card. Regular members can only
 * assign or unassign themselves.
 */
async function setCardAssignee(cardIdParam: unknown, userIdParam: unknown, userId: string, attach: boolean) {
  const { card, membership } = await getCardAccess(cardIdParam, userId);
  const assigneeId = assertUuid(userIdParam, "Membro não encontrado");

  if (membership.role !== "admin" && assigneeId !== userId) {
    throw forbidden(
      "Apenas administradores podem atribuir outros membros a um card",
    );
  }

  const relation = AppDataSource.createQueryBuilder()
    .relation(Card, "assignees")
    .of(card.id);
  const attached = await AppDataSource.getRepository(Card).exists({
    where: { id: card.id, assignees: { id: assigneeId } },
  });

  if (attach && !attached) {
    const isMember = await AppDataSource.getRepository(BoardMember).existsBy({
      boardId: card.boardId,
      userId: assigneeId,
    });
    if (!isMember) {
      throw badRequest("Só é possível atribuir membros do quadro");
    }
    await relation.add(assigneeId);
  }
  if (!attach && attached) await relation.remove(assigneeId);
  return card.id;
}

router.put("/cards/:cardId/assignees/:userId", async (req, res) => {
  const cardId = await setCardAssignee(req.params.cardId, req.params.userId, getUserId(res), true);
  res.json({ card: await loadCardDetail(cardId) });
});

router.delete("/cards/:cardId/assignees/:userId", async (req, res) => {
  const cardId = await setCardAssignee(req.params.cardId, req.params.userId, getUserId(res), false);
  res.json({ card: await loadCardDetail(cardId) });
});

export default router;
