import { Router } from "express";
import { In } from "typeorm";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { Board } from "../../entities/Board";
import { BoardList } from "../../entities/BoardList";
import { BoardMember } from "../../entities/BoardMember";
import { Card } from "../../entities/Card";
import { Label } from "../../entities/Label";
import { notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { hexColor } from "../../utils/validate";
import {
  isOverdue,
  serializeCardSummary,
  serializeLabel,
  serializeMember,
} from "../serializers";
import { commentCountsByCard } from "../cards/cards.queries";

const DEFAULT_LISTS = ["A fazer", "Em progresso", "Concluído"];

const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do quadro").max(120),
  color: hexColor.default("#1D3557"),
  withDefaultLists: z.boolean().default(false),
});

const updateBoardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do quadro").max(120).optional(),
  color: hexColor.optional(),
});

const boardFiltersSchema = z.object({
  labels: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : [])),
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const boardsRoutes = Router();

boardsRoutes.get("/", async (req, res) => {
  const memberships = await AppDataSource.getRepository(BoardMember).find({
    where: { userId: req.userId },
    relations: { board: true },
    order: { createdAt: "ASC" },
  });

  const boardIds = memberships.map((m) => m.boardId);
  if (boardIds.length === 0) {
    res.json([]);
    return;
  }

  const listCounts = await AppDataSource.getRepository(BoardList)
    .createQueryBuilder("list")
    .select("list.board_id", "boardId")
    .addSelect("COUNT(*)::int", "count")
    .where("list.board_id IN (:...boardIds)", { boardIds })
    .groupBy("list.board_id")
    .getRawMany<{ boardId: string; count: number }>();

  const cardCounts = await AppDataSource.getRepository(Card)
    .createQueryBuilder("card")
    .innerJoin("card.list", "list")
    .select("list.board_id", "boardId")
    .addSelect("COUNT(*)::int", "count")
    .addSelect(
      "COUNT(*) FILTER (WHERE card.due_date < NOW() AND card.completed = false)::int",
      "overdue",
    )
    .where("list.board_id IN (:...boardIds)", { boardIds })
    .groupBy("list.board_id")
    .getRawMany<{ boardId: string; count: number; overdue: number }>();

  const members = await AppDataSource.getRepository(BoardMember).find({
    where: { boardId: In(boardIds) },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });

  res.json(
    memberships.map(({ board, role }) => {
      const cards = cardCounts.find((c) => c.boardId === board.id);
      return {
        id: board.id,
        name: board.name,
        color: board.color,
        role,
        listCount: listCounts.find((l) => l.boardId === board.id)?.count ?? 0,
        cardCount: cards?.count ?? 0,
        overdueCount: cards?.overdue ?? 0,
        members: members
          .filter((m) => m.boardId === board.id)
          .map(serializeMember),
        createdAt: board.createdAt,
      };
    }),
  );
});

boardsRoutes.post("/", async (req, res) => {
  const data = createBoardSchema.parse(req.body);

  const board = await AppDataSource.transaction(async (manager) => {
    const created = await manager.save(
      manager.create(Board, { name: data.name, color: data.color }),
    );

    await manager.save(
      manager.create(BoardMember, {
        boardId: created.id,
        userId: req.userId,
        role: "admin",
      }),
    );

    if (data.withDefaultLists) {
      await manager.save(
        DEFAULT_LISTS.map((name, position) =>
          manager.create(BoardList, { name, position, boardId: created.id }),
        ),
      );
    }

    return created;
  });

  res.status(201).json({ id: board.id, name: board.name, color: board.color, role: "admin" });
});

boardsRoutes.get("/:boardId", requireBoardRole("viewer"), async (req, res) => {
  const boardId = req.membership.boardId;
  const filters = boardFiltersSchema.parse(req.query);

  const board = await AppDataSource.getRepository(Board).findOneBy({ id: boardId });
  if (!board) {
    throw notFound("Quadro não encontrado");
  }

  const lists = await AppDataSource.getRepository(BoardList).find({
    where: { boardId },
    relations: {
      cards: { labels: true, assignees: true, checklists: { items: true } },
    },
    order: { position: "ASC" },
    relationLoadStrategy: "query",
  });

  const labels = await AppDataSource.getRepository(Label).find({
    where: { boardId },
    order: { createdAt: "ASC" },
  });

  const members = await AppDataSource.getRepository(BoardMember).find({
    where: { boardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });

  // Ordenação feita aqui porque o carregamento por consultas separadas
  // não garante a ordem das relações aninhadas
  for (const list of lists) {
    list.cards.sort((a, b) => a.position - b.position);
  }

  const allCards = lists.flatMap((list) => list.cards);
  const commentCounts = await commentCountsByCard(allCards.map((c) => c.id));

  const labelFilter = new Set(filters.labels);
  const matchesFilters = (card: Card) =>
    (labelFilter.size === 0 || card.labels.some((l) => labelFilter.has(l.id))) &&
    (!filters.overdue || isOverdue(card));

  const visibleCount = allCards.filter(matchesFilters).length;

  res.json({
    id: board.id,
    name: board.name,
    color: board.color,
    role: req.membership.role,
    cardCount: allCards.length,
    visibleCardCount: visibleCount,
    filters: { labels: filters.labels, overdue: filters.overdue },
    labels: labels.map((label) => ({
      ...serializeLabel(label),
      usage: allCards.filter((c) => c.labels.some((l) => l.id === label.id)).length,
    })),
    members: members.map(serializeMember),
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      position: list.position,
      cardCount: list.cards.length,
      cards: list.cards
        .filter(matchesFilters)
        .map((card) => serializeCardSummary(card, commentCounts.get(card.id) ?? 0)),
    })),
  });
});

boardsRoutes.patch("/:boardId", requireBoardRole("admin"), async (req, res) => {
  const data = updateBoardSchema.parse(req.body);
  const repo = AppDataSource.getRepository(Board);

  const board = await repo.findOneBy({ id: req.membership.boardId });
  if (!board) {
    throw notFound("Quadro não encontrado");
  }

  repo.merge(board, data);
  await repo.save(board);

  res.json({ id: board.id, name: board.name, color: board.color });
});

boardsRoutes.delete("/:boardId", requireBoardRole("admin"), async (req, res) => {
  // Listas, cards, checklists, etiquetas, comentários e membros caem em cascata
  await AppDataSource.getRepository(Board).delete({ id: req.membership.boardId });
  res.status(204).send();
});
