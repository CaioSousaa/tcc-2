import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { BoardList } from "../../entities/BoardList";
import { Card } from "../../entities/Card";
import { AppError, notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { clampIndex, persistOrder } from "../../utils/positions";
import { idParam, uuid } from "../../utils/validate";
import { serializeCardSummary } from "../serializers";

const listName = z.string().trim().min(1, "Informe o nome da lista").max(120);

const createListSchema = z.object({
  name: listName,
  position: z.number().int().min(0).optional(),
});

const updateListSchema = z.object({ name: listName });

const reorderSchema = z.object({
  listIds: z.array(uuid).min(1),
});

const deleteListSchema = z.object({
  targetListId: uuid.optional(),
});

const createCardSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do card").max(200),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const lists = () => AppDataSource.getRepository(BoardList);

async function findListInBoard(boardId: string, listId: string) {
  const list = await lists().findOneBy({ id: listId, boardId });
  if (!list) {
    throw notFound("Lista não encontrada");
  }
  return list;
}

const serializeList = (list: BoardList) => ({
  id: list.id,
  name: list.name,
  position: list.position,
});

export const listsRoutes = Router({ mergeParams: true });

listsRoutes.post("/", requireBoardRole("editor"), async (req, res) => {
  const { name, position } = createListSchema.parse(req.body);
  const boardId = req.membership.boardId;

  const created = await AppDataSource.transaction(async (manager) => {
    const siblings = await manager.find(BoardList, {
      where: { boardId },
      order: { position: "ASC" },
    });

    const index = clampIndex(position, siblings.length);
    const list = await manager.save(
      manager.create(BoardList, { name, boardId, position: index }),
    );

    siblings.splice(index, 0, list);
    await persistOrder(manager, BoardList, siblings);
    return list;
  });

  res.status(201).json(serializeList(created));
});

// Declarada antes de "/:listId" para não ser capturada como id
listsRoutes.put("/order", requireBoardRole("editor"), async (req, res) => {
  const { listIds } = reorderSchema.parse(req.body);
  const boardId = req.membership.boardId;

  const reordered = await AppDataSource.transaction(async (manager) => {
    const current = await manager.find(BoardList, { where: { boardId } });

    const sameSet =
      listIds.length === current.length &&
      new Set(listIds).size === listIds.length &&
      current.every((list) => listIds.includes(list.id));

    if (!sameSet) {
      throw new AppError("A nova ordem deve conter todas as listas do quadro, uma única vez");
    }

    const ordered = listIds.map((id) => current.find((list) => list.id === id)!);
    await persistOrder(manager, BoardList, ordered);
    return ordered;
  });

  res.json(reordered.map(serializeList));
});

listsRoutes.patch("/:listId", requireBoardRole("editor"), async (req, res) => {
  const { name } = updateListSchema.parse(req.body);
  const list = await findListInBoard(req.membership.boardId, idParam(req, "listId"));

  list.name = name;
  await lists().save(list);

  res.json(serializeList(list));
});

/**
 * Exclui a lista. Se `targetListId` vier na query, os cards são movidos para o
 * final da lista de destino; caso contrário são excluídos junto com a lista.
 */
listsRoutes.delete("/:listId", requireBoardRole("editor"), async (req, res) => {
  const boardId = req.membership.boardId;
  const listId = idParam(req, "listId");
  const { targetListId } = deleteListSchema.parse(req.query);

  const result = await AppDataSource.transaction(async (manager) => {
    const list = await manager.findOneBy(BoardList, { id: listId, boardId });
    if (!list) {
      throw notFound("Lista não encontrada");
    }

    const cards = await manager.find(Card, {
      where: { listId },
      order: { position: "ASC" },
    });

    let movedCards = 0;
    if (targetListId && cards.length > 0) {
      if (targetListId === listId) {
        throw new AppError("A lista de destino deve ser diferente da lista excluída");
      }

      const target = await manager.findOneBy(BoardList, { id: targetListId, boardId });
      if (!target) {
        throw notFound("Lista de destino não encontrada");
      }

      const offset = await manager.countBy(Card, { listId: target.id });
      for (const [index, card] of cards.entries()) {
        await manager.update(Card, { id: card.id }, {
          listId: target.id,
          position: offset + index,
        });
      }
      movedCards = cards.length;
    }

    await manager.delete(BoardList, { id: listId });

    const remaining = await manager.find(BoardList, {
      where: { boardId },
      order: { position: "ASC" },
    });
    await persistOrder(manager, BoardList, remaining);

    return { movedCards, deletedCards: cards.length - movedCards };
  });

  res.json(result);
});

listsRoutes.post("/:listId/cards", requireBoardRole("editor"), async (req, res) => {
  const data = createCardSchema.parse(req.body);
  const list = await findListInBoard(req.membership.boardId, idParam(req, "listId"));

  const repo = AppDataSource.getRepository(Card);
  const position = await repo.countBy({ listId: list.id });

  const card = await repo.save(
    repo.create({
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
      completed: false,
      listId: list.id,
      position,
    }),
  );

  res.status(201).json(
    serializeCardSummary({ ...card, labels: [], assignees: [], checklists: [] } as Card, 0),
  );
});
