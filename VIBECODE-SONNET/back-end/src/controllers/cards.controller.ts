import type { Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import {
  assertUuid,
  requireCardAccess,
  requireListAccess,
} from "../services/access";
import {
  cardRepo,
  commentRepo,
  labelRepo,
  listRepo,
  memberRepo,
} from "../services/repositories";
import {
  serializeCardDetail,
  serializeCardSummary,
} from "../services/serializers";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const titleSchema = z
  .string({ message: "Título é obrigatório" })
  .trim()
  .min(1, "Título é obrigatório")
  .max(200, "Título muito longo");

const createCardSchema = z.object({
  title: titleSchema,
  description: z.string().max(10000).nullish(),
  dueDate: z.iso.datetime({ offset: true, message: "Data inválida" }).nullish(),
});

const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: z.string().max(10000).nullable().optional(),
  dueDate: z.iso
    .datetime({ offset: true, message: "Data inválida" })
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
});

const moveCardSchema = z.object({
  listId: z.string({ message: "Lista de destino é obrigatória" }),
  position: z.number().int().min(0),
});

const labelSchema = z.object({ labelId: z.string() });
const assigneeSchema = z.object({ userId: z.string() });

async function loadCardDetail(cardId: string) {
  const card = await cardRepo().findOne({
    where: { id: cardId },
    relations: {
      list: true,
      createdBy: true,
      labels: true,
      assignees: true,
      checklists: { items: true },
      comments: { author: true },
    },
  });
  if (!card) {
    throw new AppError(404, "Card não encontrado", "NOT_FOUND");
  }
  return serializeCardDetail(card);
}

async function loadCardSummary(cardId: string) {
  const card = await cardRepo().findOne({
    where: { id: cardId },
    relations: { labels: true, assignees: true, checklists: { items: true } },
  });
  if (!card) {
    throw new AppError(404, "Card não encontrado", "NOT_FOUND");
  }
  const commentCount = await commentRepo().countBy({ cardId });
  return serializeCardSummary(card, commentCount);
}

export async function createCard(req: Request, res: Response) {
  const { list } = await requireListAccess(String(req.params.listId), req.userId);
  const data = parseBody(createCardSchema, req.body);

  const position = await cardRepo().countBy({ listId: list.id });
  const card = await cardRepo().save(
    cardRepo().create({
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      listId: list.id,
      boardId: list.boardId,
      position,
      createdById: req.userId,
    }),
  );

  return res.status(201).json({ card: await loadCardSummary(card.id) });
}

export async function getCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  return res.json({ card: await loadCardDetail(card.id) });
}

export async function updateCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const data = parseBody(updateCardSchema, req.body);

  const changes: Partial<Card> = {};
  if (data.title !== undefined) changes.title = data.title;
  if (data.description !== undefined) changes.description = data.description;
  if (data.dueDate !== undefined) {
    changes.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.completed !== undefined) changes.completed = data.completed;

  if (Object.keys(changes).length > 0) {
    await cardRepo().update({ id: card.id }, changes);
  }

  return res.json({ card: await loadCardDetail(card.id) });
}

export async function deleteCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(Card, { id: card.id });
    const siblings = await manager.find(Card, {
      where: { listId: card.listId },
      order: { position: "ASC" },
    });
    for (const [index, sibling] of siblings.entries()) {
      if (sibling.position !== index) {
        await manager.update(Card, { id: sibling.id }, { position: index });
      }
    }
  });

  return res.status(204).send();
}

/**
 * Move um card para outra posição, na mesma lista ou em outra lista do mesmo
 * quadro, reindexando as posições das listas de origem e destino.
 */
export async function moveCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const data = parseBody(moveCardSchema, req.body);

  const targetListId = assertUuid(data.listId, "Lista de destino");
  const targetList = await listRepo().findOneBy({ id: targetListId });
  if (!targetList || targetList.boardId !== card.boardId) {
    throw new AppError(
      400,
      "Cards só podem ser movidos entre listas do mesmo quadro",
      "INVALID_TARGET",
    );
  }

  const sourceListId = card.listId;

  await AppDataSource.transaction(async (manager) => {
    const targetCards = (
      await manager.find(Card, {
        where: { listId: targetList.id },
        order: { position: "ASC" },
      })
    ).filter((c) => c.id !== card.id);

    const index = Math.min(data.position, targetCards.length);
    targetCards.splice(index, 0, card);

    for (const [position, item] of targetCards.entries()) {
      await manager.update(
        Card,
        { id: item.id },
        { listId: targetList.id, position },
      );
    }

    if (sourceListId !== targetList.id) {
      const sourceCards = await manager.find(Card, {
        where: { listId: sourceListId },
        order: { position: "ASC" },
      });
      for (const [position, item] of sourceCards.entries()) {
        if (item.position !== position) {
          await manager.update(Card, { id: item.id }, { position });
        }
      }
    }
  });

  return res.json({ card: await loadCardSummary(card.id) });
}

export async function addLabelToCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const { labelId } = parseBody(labelSchema, req.body);
  assertUuid(labelId, "Etiqueta");

  const label = await labelRepo().findOneBy({ id: labelId });
  if (!label || label.boardId !== card.boardId) {
    throw new AppError(404, "Etiqueta não encontrada neste quadro", "NOT_FOUND");
  }

  const withLabels = await cardRepo().findOne({
    where: { id: card.id },
    relations: { labels: true },
  });
  if (!withLabels?.labels.some((l) => l.id === label.id)) {
    await cardRepo()
      .createQueryBuilder()
      .relation(Card, "labels")
      .of(card.id)
      .add(label.id);
  }

  return res.json({ card: await loadCardDetail(card.id) });
}

export async function removeLabelFromCard(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const labelId = assertUuid(req.params.labelId, "Etiqueta");

  await cardRepo()
    .createQueryBuilder()
    .relation(Card, "labels")
    .of(card.id)
    .remove(labelId);

  return res.json({ card: await loadCardDetail(card.id) });
}

export async function addAssignee(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const { userId } = parseBody(assigneeSchema, req.body);
  assertUuid(userId, "Usuário");

  const isMember = await memberRepo().existsBy({
    boardId: card.boardId,
    userId,
  });
  if (!isMember) {
    throw new AppError(
      400,
      "Só é possível atribuir membros do quadro ao card",
      "NOT_A_MEMBER",
    );
  }

  const withAssignees = await cardRepo().findOne({
    where: { id: card.id },
    relations: { assignees: true },
  });
  if (!withAssignees?.assignees.some((u) => u.id === userId)) {
    await cardRepo()
      .createQueryBuilder()
      .relation(Card, "assignees")
      .of(card.id)
      .add(userId);
  }

  return res.json({ card: await loadCardDetail(card.id) });
}

export async function removeAssignee(req: Request, res: Response) {
  const { card } = await requireCardAccess(String(req.params.cardId), req.userId);
  const userId = assertUuid(req.params.userId, "Usuário");

  await cardRepo()
    .createQueryBuilder()
    .relation(Card, "assignees")
    .of(card.id)
    .remove(userId);

  return res.json({ card: await loadCardDetail(card.id) });
}
