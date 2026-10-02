import type { Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import {
  assertUuid,
  requireBoardAccess,
  requireListAccess,
} from "../services/access";
import { cardRepo, listRepo } from "../services/repositories";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const titleSchema = z
  .string({ message: "Título é obrigatório" })
  .trim()
  .min(1, "Título é obrigatório")
  .max(120, "Título muito longo");

const positionSchema = z.number().int().min(0);

const createListSchema = z.object({
  title: titleSchema,
  position: positionSchema.optional(),
});
const updateListSchema = z.object({
  title: titleSchema.optional(),
  position: positionSchema.optional(),
});
const reorderSchema = z.object({
  listIds: z.array(z.string()).min(1, "Informe a nova ordem das listas"),
});

const deleteQuerySchema = z.object({
  strategy: z.enum(["move", "delete"]).optional(),
  targetListId: z.string().optional(),
});

/**
 * Insere/move a lista `listId` para o índice `position` dentro do quadro e
 * reindexa as demais listas (0..n-1).
 */
async function placeListAt(boardId: string, listId: string, position: number) {
  await AppDataSource.transaction(async (manager) => {
    const lists = (
      await manager.find(List, {
        where: { boardId },
        order: { position: "ASC", createdAt: "ASC" },
      })
    ).filter((l) => l.id !== listId);

    const index = Math.min(position, lists.length);
    const ordered = [
      ...lists.slice(0, index).map((l) => l.id),
      listId,
      ...lists.slice(index).map((l) => l.id),
    ];

    for (const [i, id] of ordered.entries()) {
      await manager.update(List, { id }, { position: i });
    }
  });
}

function serializeList(list: List) {
  return {
    id: list.id,
    title: list.title,
    position: list.position,
    boardId: list.boardId,
  };
}

export async function createList(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const data = parseBody(createListSchema, req.body);

  const count = await listRepo().countBy({ boardId: board.id });
  let list = await listRepo().save(
    listRepo().create({ title: data.title, boardId: board.id, position: count }),
  );

  if (data.position !== undefined && data.position < count) {
    await placeListAt(board.id, list.id, data.position);
    list = await listRepo().findOneByOrFail({ id: list.id });
  }

  return res.status(201).json({ list: { ...serializeList(list), cards: [] } });
}

export async function updateList(req: Request, res: Response) {
  const { list } = await requireListAccess(
    String(req.params.listId),
    req.userId,
    "admin",
  );
  const data = parseBody(updateListSchema, req.body);

  if (data.title !== undefined) {
    await listRepo().update({ id: list.id }, { title: data.title });
  }
  if (data.position !== undefined && data.position !== list.position) {
    await placeListAt(list.boardId, list.id, data.position);
  }

  const saved = await listRepo().findOneByOrFail({ id: list.id });
  return res.json({ list: serializeList(saved) });
}

export async function reorderLists(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const { listIds } = parseBody(reorderSchema, req.body);

  const lists = await listRepo().findBy({ boardId: board.id });
  const existing = new Set(lists.map((l) => l.id));
  const unique = new Set(listIds);

  if (
    unique.size !== listIds.length ||
    listIds.length !== lists.length ||
    listIds.some((id) => !existing.has(id))
  ) {
    throw new AppError(
      400,
      "A nova ordem deve conter exatamente as listas do quadro",
      "INVALID_ORDER",
    );
  }

  await AppDataSource.transaction(async (manager) => {
    for (const [index, id] of listIds.entries()) {
      await manager.update(List, { id }, { position: index });
    }
  });

  return res.json({ listIds });
}

/**
 * Exclusão de lista. Regra para listas com cards:
 * - se o quadro estiver com a regra `blockNonEmptyListDeletion` ativa, a
 *   exclusão é sempre bloqueada (409 LIST_DELETION_BLOCKED);
 * - sem `strategy`: a exclusão é bloqueada (409 LIST_NOT_EMPTY) e o cliente
 *   precisa escolher explicitamente o destino dos cards;
 * - `strategy=move&targetListId=<id>`: os cards são movidos para o final da
 *   lista de destino (do mesmo quadro) e a lista é excluída;
 * - `strategy=delete`: a lista e todos os seus cards (com checklists,
 *   comentários e associações) são excluídos.
 * Apenas administradores do quadro podem excluir listas.
 */
export async function deleteList(req: Request, res: Response) {
  const { list, board } = await requireListAccess(
    String(req.params.listId),
    req.userId,
    "admin",
  );
  const query = deleteQuerySchema.parse(req.query);

  const cardCount = await cardRepo().countBy({ listId: list.id });

  if (cardCount > 0 && board.blockNonEmptyListDeletion) {
    throw new AppError(
      409,
      "A regra deste quadro bloqueia a exclusão de listas que ainda possuem cards. Mova ou exclua os cards antes.",
      "LIST_DELETION_BLOCKED",
      { cardCount },
    );
  }

  if (cardCount > 0 && !query.strategy) {
    throw new AppError(
      409,
      `A lista possui ${cardCount} card(s). Escolha se deseja movê-los para outra lista ou excluí-los.`,
      "LIST_NOT_EMPTY",
      { cardCount },
    );
  }

  let targetList: List | null = null;
  if (cardCount > 0 && query.strategy === "move") {
    const targetListId = assertUuid(query.targetListId, "Lista de destino");
    if (targetListId === list.id) {
      throw new AppError(
        400,
        "A lista de destino deve ser diferente da lista excluída",
        "INVALID_TARGET",
      );
    }
    targetList = await listRepo().findOneBy({
      id: targetListId,
      boardId: list.boardId,
    });
    if (!targetList) {
      throw new AppError(
        404,
        "Lista de destino não encontrada neste quadro",
        "NOT_FOUND",
      );
    }
  }

  await AppDataSource.transaction(async (manager) => {
    if (targetList) {
      const offset = await manager.countBy(Card, { listId: targetList.id });
      const cards = await manager.find(Card, {
        where: { listId: list.id },
        order: { position: "ASC" },
      });
      for (const [index, card] of cards.entries()) {
        await manager.update(
          Card,
          { id: card.id },
          { listId: targetList.id, position: offset + index },
        );
      }
    }

    // Os cards restantes (strategy=delete) caem via ON DELETE CASCADE.
    await manager.delete(List, { id: list.id });

    const remaining = await manager.find(List, {
      where: { boardId: list.boardId },
      order: { position: "ASC" },
    });
    for (const [index, item] of remaining.entries()) {
      if (item.position !== index) {
        await manager.update(List, { id: item.id }, { position: index });
      }
    }
  });

  return res.json({
    deletedListId: list.id,
    movedCards: targetList ? cardCount : 0,
    deletedCards: targetList ? 0 : cardCount,
    targetListId: targetList?.id ?? null,
  });
}
