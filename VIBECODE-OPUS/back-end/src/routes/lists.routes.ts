import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { getUserId } from "../utils/auth";
import { getListAccess, getMembership, requireAdmin } from "../utils/access";
import { badRequest, conflict } from "../utils/HttpError";
import { persistOrder } from "../utils/positions";
import { uuidSchema } from "../utils/schemas";
import type { EntityManager } from "typeorm";

const router = Router();

const LISTS_ADMIN_MESSAGE = "Apenas administradores podem gerenciar listas";

const titleSchema = z
  .string({ error: "Informe o nome da lista" })
  .trim()
  .min(1, "Informe o nome da lista")
  .max(120, "O nome deve ter no máximo 120 caracteres");

const positionSchema = z.number().int().min(0, "Posição inválida");

const createListSchema = z.object({
  title: titleSchema,
  position: positionSchema.optional(),
});
const updateListSchema = z.object({
  title: titleSchema.optional(),
  position: positionSchema.optional(),
});
const reorderSchema = z.object({
  listIds: z.array(uuidSchema, { error: "Informe a nova ordem das listas" }),
});

/**
 * What happens to the cards of a list being deleted (RF05):
 * - board rule `blockListDeletionWithCards`: lists with cards cannot be deleted;
 * - otherwise, with no strategy and cards present, the deletion is refused
 *   (409) so the client must explicitly choose one of:
 *   - "move": cards are appended, in order, to the end of `targetListId`;
 *   - "delete": cards (and their checklists/comments) are deleted with the list.
 */
const deleteListSchema = z
  .object({
    cardsAction: z.enum(["move", "delete"]).optional(),
    targetListId: uuidSchema.optional(),
  })
  .refine((data) => data.cardsAction !== "move" || data.targetListId, {
    message: "Informe a lista de destino dos cards",
    path: ["targetListId"],
  });

function serializeList(list: List) {
  return { id: list.id, title: list.title, position: list.position };
}

/** Loads the board lists in display order, locking them for the transaction. */
function loadBoardLists(manager: EntityManager, boardId: string) {
  return manager.find(List, {
    where: { boardId },
    order: { position: "ASC", createdAt: "ASC" },
    lock: { mode: "pessimistic_write" },
  });
}

router.post("/boards/:boardId/lists", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, LISTS_ADMIN_MESSAGE);
  const { title, position } = createListSchema.parse(req.body);

  const list = await AppDataSource.transaction(async (manager) => {
    const lists = await loadBoardLists(manager, membership.boardId);
    const created = await manager.save(
      manager.create(List, {
        boardId: membership.boardId,
        title,
        position: lists.length,
      }),
    );
    lists.splice(Math.min(position ?? lists.length, lists.length), 0, created);
    created.position = -1;
    await persistOrder(manager, List, lists);
    return created;
  });

  res.status(201).json({ list: { ...serializeList(list), cards: [] } });
});

router.put("/boards/:boardId/lists/order", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, LISTS_ADMIN_MESSAGE);
  const { listIds } = reorderSchema.parse(req.body);

  const result = await AppDataSource.transaction(async (manager) => {
    const lists = await loadBoardLists(manager, membership.boardId);

    const byId = new Map(lists.map((list) => [list.id, list]));
    if (
      new Set(listIds).size !== listIds.length ||
      listIds.length !== lists.length ||
      listIds.some((id) => !byId.has(id))
    ) {
      throw badRequest(
        "A nova ordem deve conter exatamente as listas do quadro",
        "INVALID_ORDER",
      );
    }

    const ordered = listIds.map((id) => byId.get(id)!);
    await persistOrder(manager, List, ordered);
    return ordered;
  });

  res.json({ lists: result.map(serializeList) });
});

/** Renames a list and/or moves it to another position of the board. */
router.patch("/lists/:listId", async (req, res) => {
  const { list, membership } = await getListAccess(
    req.params.listId,
    getUserId(res),
  );
  requireAdmin(membership, LISTS_ADMIN_MESSAGE);
  const { title, position } = updateListSchema.parse(req.body);

  const updated = await AppDataSource.transaction(async (manager) => {
    if (title !== undefined) {
      await manager.update(List, { id: list.id }, { title });
    }

    if (position !== undefined) {
      const lists = await loadBoardLists(manager, list.boardId);
      const index = lists.findIndex((item) => item.id === list.id);
      const [moving] = lists.splice(index, 1);
      lists.splice(Math.min(position, lists.length), 0, moving);
      await persistOrder(manager, List, lists);
    }

    return manager.findOneByOrFail(List, { id: list.id });
  });

  res.json({ list: serializeList(updated) });
});

router.delete("/lists/:listId", async (req, res) => {
  const { list, membership } = await getListAccess(
    req.params.listId,
    getUserId(res),
  );
  requireAdmin(membership, LISTS_ADMIN_MESSAGE);
  const { cardsAction, targetListId } = deleteListSchema.parse(req.query);

  const outcome = await AppDataSource.transaction(async (manager) => {
    const board = await manager.findOneByOrFail(Board, { id: list.boardId });
    const cards = await manager.find(Card, {
      where: { listId: list.id },
      order: { position: "ASC", createdAt: "ASC" },
    });

    if (cards.length > 0 && board.blockListDeletionWithCards) {
      throw conflict(
        `A lista possui ${cards.length} card(s) e a regra do quadro bloqueia a exclusão de listas com cards. Mova ou exclua os cards antes.`,
        "LIST_DELETION_BLOCKED",
        { cardCount: cards.length },
      );
    }

    if (cards.length > 0 && !cardsAction) {
      throw conflict(
        `A lista possui ${cards.length} card(s). Escolha se eles devem ser movidos para outra lista ou excluídos.`,
        "LIST_HAS_CARDS",
        { cardCount: cards.length },
      );
    }

    let movedTo: string | null = null;
    if (cards.length > 0 && cardsAction === "move") {
      if (targetListId === list.id) {
        throw badRequest("Escolha uma lista de destino diferente");
      }
      const target = await manager.findOneBy(List, {
        id: targetListId,
        boardId: list.boardId,
      });
      if (!target) {
        throw badRequest("Lista de destino não encontrada neste quadro");
      }

      const offset = await manager.countBy(Card, { listId: target.id });
      for (let index = 0; index < cards.length; index += 1) {
        await manager.update(
          Card,
          { id: cards[index].id },
          { listId: target.id, position: offset + index },
        );
      }
      movedTo = target.id;
    }

    // With "delete" (or an empty list) the cards go away through the FK cascade.
    await manager.delete(List, { id: list.id });

    const remaining = await loadBoardLists(manager, list.boardId);
    await persistOrder(manager, List, remaining);

    return {
      cardCount: cards.length,
      cardsAction: cards.length > 0 ? cardsAction : null,
      movedTo,
    };
  });

  res.json(outcome);
});

export default router;
