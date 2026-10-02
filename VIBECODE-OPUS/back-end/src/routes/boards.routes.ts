import { Router } from "express";
import { In, LessThan } from "typeorm";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { Card } from "../entities/Card";
import { Comment } from "../entities/Comment";
import { Label } from "../entities/Label";
import { List } from "../entities/List";
import { getUserId } from "../utils/auth";
import { getMembership, requireAdmin } from "../utils/access";
import { forbidden } from "../utils/HttpError";
import {
  publicUser,
  serializeCardSummary,
  serializeLabel,
} from "../utils/serializers";
import { boardColorSchema } from "../utils/schemas";

const router = Router();

const DEFAULT_LABELS = [
  { name: "Bug", color: "red" },
  { name: "Frontend", color: "blue" },
  { name: "UX", color: "purple" },
  { name: "Infra", color: "green" },
  { name: "Urgente", color: "amber" },
];

const DEFAULT_LISTS = ["A fazer", "Em progresso", "Concluído"];
const MEMBER_PREVIEW_LIMIT = 5;

const boardSchema = z.object({
  title: z
    .string({ error: "Informe o título do quadro" })
    .trim()
    .min(1, "Informe o título do quadro")
    .max(120, "O título deve ter no máximo 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2000 caracteres")
    .nullish(),
  color: boardColorSchema.optional(),
  blockListDeletionWithCards: z.boolean().optional(),
});

const createBoardSchema = boardSchema.extend({
  withDefaultLists: z.boolean().default(true),
});

const updateBoardSchema = boardSchema.partial();

function serializeBoard(board: Board) {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    color: board.color,
    blockListDeletionWithCards: board.blockListDeletionWithCards,
    ownerId: board.ownerId,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

async function countBy(
  entity: typeof BoardMember | typeof List | typeof Card,
  boardIds: string[],
) {
  const counts = new Map<string, number>();
  if (boardIds.length === 0) return counts;

  const rows: { boardId: string; count: string }[] = await AppDataSource
    .getRepository(entity)
    .createQueryBuilder("item")
    .select("item.boardId", "boardId")
    .addSelect("COUNT(*)", "count")
    .where("item.boardId IN (:...boardIds)", { boardIds })
    .groupBy("item.boardId")
    .getRawMany();

  for (const row of rows) counts.set(row.boardId, Number(row.count));
  return counts;
}

router.get("/", async (_req, res) => {
  const userId = getUserId(res);
  const memberships = await AppDataSource.getRepository(BoardMember).find({
    where: { userId },
    relations: { board: true },
  });

  const boardIds = memberships.map((membership) => membership.boardId);
  const [memberCounts, listCounts, cardCounts, overdueCards, boardMembers] =
    await Promise.all([
      countBy(BoardMember, boardIds),
      countBy(List, boardIds),
      countBy(Card, boardIds),
      boardIds.length
        ? AppDataSource.getRepository(Card).find({
            select: { id: true, boardId: true },
            where: {
              boardId: In(boardIds),
              completed: false,
              dueDate: LessThan(new Date()),
            },
          })
        : Promise.resolve([] as Card[]),
      boardIds.length
        ? AppDataSource.getRepository(BoardMember).find({
            where: { boardId: In(boardIds) },
            relations: { user: true },
            order: { createdAt: "ASC" },
          })
        : Promise.resolve([] as BoardMember[]),
    ]);

  const overdueCounts = new Map<string, number>();
  for (const card of overdueCards) {
    overdueCounts.set(card.boardId, (overdueCounts.get(card.boardId) ?? 0) + 1);
  }

  const boards = memberships
    .map((membership) => ({
      ...serializeBoard(membership.board),
      role: membership.role,
      isOwner: membership.board.ownerId === userId,
      memberCount: memberCounts.get(membership.boardId) ?? 0,
      listCount: listCounts.get(membership.boardId) ?? 0,
      cardCount: cardCounts.get(membership.boardId) ?? 0,
      overdueCount: overdueCounts.get(membership.boardId) ?? 0,
      members: boardMembers
        .filter((member) => member.boardId === membership.boardId)
        .slice(0, MEMBER_PREVIEW_LIMIT)
        .map((member) => publicUser(member.user)),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  res.json({ boards });
});

router.post("/", async (req, res) => {
  const userId = getUserId(res);
  const data = createBoardSchema.parse(req.body);

  const board = await AppDataSource.transaction(async (manager) => {
    const created = await manager.save(
      manager.create(Board, {
        title: data.title,
        description: data.description || null,
        color: data.color ?? "navy",
        blockListDeletionWithCards: data.blockListDeletionWithCards ?? false,
        ownerId: userId,
      }),
    );

    await manager.save(
      manager.create(BoardMember, {
        boardId: created.id,
        userId,
        role: "admin",
      }),
    );

    await manager.save(
      DEFAULT_LABELS.map((label) =>
        manager.create(Label, { ...label, boardId: created.id }),
      ),
    );

    if (data.withDefaultLists) {
      await manager.save(
        DEFAULT_LISTS.map((title, position) =>
          manager.create(List, { boardId: created.id, title, position }),
        ),
      );
    }

    return created;
  });

  res.status(201).json({
    board: { ...serializeBoard(board), role: "admin", isOwner: true },
  });
});

router.get("/:boardId", async (req, res) => {
  const userId = getUserId(res);
  const membership = await getMembership(req.params.boardId, userId);
  const boardId = membership.boardId;

  const [board, members, labels, lists, cards] = await Promise.all([
    AppDataSource.getRepository(Board).findOneByOrFail({ id: boardId }),
    AppDataSource.getRepository(BoardMember).find({
      where: { boardId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    }),
    AppDataSource.getRepository(Label).find({
      where: { boardId },
      order: { name: "ASC" },
    }),
    AppDataSource.getRepository(List).find({
      where: { boardId },
      order: { position: "ASC", createdAt: "ASC" },
    }),
    AppDataSource.getRepository(Card).find({
      where: { boardId },
      relations: { labels: true, assignees: true, checklists: { items: true } },
      order: { position: "ASC", createdAt: "ASC" },
    }),
  ]);

  const commentCounts = new Map<string, number>();
  if (cards.length > 0) {
    const rows: { cardId: string; count: string }[] = await AppDataSource
      .getRepository(Comment)
      .createQueryBuilder("comment")
      .select("comment.cardId", "cardId")
      .addSelect("COUNT(*)", "count")
      .where("comment.cardId IN (:...cardIds)", {
        cardIds: cards.map((card) => card.id),
      })
      .groupBy("comment.cardId")
      .getRawMany();
    for (const row of rows) commentCounts.set(row.cardId, Number(row.count));
  }

  res.json({
    board: serializeBoard(board),
    role: membership.role,
    isOwner: board.ownerId === userId,
    members: members.map((member) => ({
      userId: member.userId,
      role: member.role,
      isOwner: member.userId === board.ownerId,
      joinedAt: member.createdAt.toISOString(),
      user: publicUser(member.user),
    })),
    labels: labels.map(serializeLabel),
    lists: lists.map((list) => ({
      id: list.id,
      title: list.title,
      position: list.position,
      cards: cards
        .filter((card) => card.listId === list.id)
        .map((card) =>
          serializeCardSummary(card, commentCounts.get(card.id) ?? 0),
        ),
    })),
  });
});

router.patch("/:boardId", async (req, res) => {
  const userId = getUserId(res);
  const membership = await getMembership(req.params.boardId, userId);
  requireAdmin(membership, "Apenas administradores podem editar o quadro");
  const data = updateBoardSchema.parse(req.body);

  const boards = AppDataSource.getRepository(Board);
  const board = await boards.findOneByOrFail({ id: membership.boardId });
  if (data.title !== undefined) board.title = data.title;
  if (data.description !== undefined) board.description = data.description || null;
  if (data.color !== undefined) board.color = data.color;
  if (data.blockListDeletionWithCards !== undefined) {
    board.blockListDeletionWithCards = data.blockListDeletionWithCards;
  }
  await boards.save(board);

  res.json({ board: serializeBoard(board) });
});

router.delete("/:boardId", async (req, res) => {
  const userId = getUserId(res);
  const membership = await getMembership(req.params.boardId, userId);

  const boards = AppDataSource.getRepository(Board);
  const board = await boards.findOneByOrFail({ id: membership.boardId });
  if (board.ownerId !== userId) {
    throw forbidden("Apenas o criador do quadro pode excluí-lo");
  }

  await boards.delete({ id: board.id });
  res.status(204).send();
});

export default router;
