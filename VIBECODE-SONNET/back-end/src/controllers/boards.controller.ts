import type { Request, Response } from "express";
import { z } from "zod";
import { In } from "typeorm";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { List } from "../entities/List";
import { requireBoardAccess } from "../services/access";
import {
  cardRepo,
  commentRepo,
  labelRepo,
  listRepo,
  memberRepo,
} from "../services/repositories";
import {
  serializeCardSummary,
  serializeLabel,
  serializeUser,
} from "../services/serializers";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use o formato #RRGGBB)");

const createBoardSchema = z.object({
  title: z
    .string({ message: "Título é obrigatório" })
    .trim()
    .min(1, "Título é obrigatório")
    .max(120, "Título muito longo"),
  description: z.string().trim().max(2000).nullish(),
  color: colorSchema.optional(),
  withDefaultLists: z.boolean().optional(),
});

const updateBoardSchema = createBoardSchema
  .omit({ withDefaultLists: true })
  .partial()
  .extend({ blockNonEmptyListDeletion: z.boolean().optional() });

const DEFAULT_LISTS = ["A fazer", "Em progresso", "Concluído"];

export async function listBoards(req: Request, res: Response) {
  const memberships = await memberRepo().find({
    where: { userId: req.userId },
    relations: { board: { owner: true } },
  });

  const boardIds = memberships.map((m) => m.boardId);
  const listCounts = new Map<string, number>();
  const cardCounts = new Map<string, number>();
  const overdueCounts = new Map<string, number>();
  const membersByBoard = new Map<string, BoardMember[]>();

  if (boardIds.length > 0) {
    const [listRows, cardRows, boardMembers] = await Promise.all([
      listRepo()
        .createQueryBuilder("l")
        .select('l."boardId"', "boardId")
        .addSelect("COUNT(*)", "count")
        .where('l."boardId" IN (:...boardIds)', { boardIds })
        .groupBy('l."boardId"')
        .getRawMany<{ boardId: string; count: string }>(),
      cardRepo()
        .createQueryBuilder("c")
        .select('c."boardId"', "boardId")
        .addSelect("COUNT(*)", "count")
        .addSelect(
          'COUNT(*) FILTER (WHERE c."dueDate" < NOW() AND c."completed" = false)',
          "overdue",
        )
        .where('c."boardId" IN (:...boardIds)', { boardIds })
        .groupBy('c."boardId"')
        .getRawMany<{ boardId: string; count: string; overdue: string }>(),
      memberRepo().find({
        where: { boardId: In(boardIds) },
        relations: { user: true },
        order: { createdAt: "ASC" },
      }),
    ]);

    listRows.forEach((r) => listCounts.set(r.boardId, Number(r.count)));
    cardRows.forEach((r) => {
      cardCounts.set(r.boardId, Number(r.count));
      overdueCounts.set(r.boardId, Number(r.overdue));
    });
    boardMembers.forEach((m) => {
      const current = membersByBoard.get(m.boardId) ?? [];
      current.push(m);
      membersByBoard.set(m.boardId, current);
    });
  }

  const boards = memberships
    .map((m) => {
      const isOwner = m.board.ownerId === req.userId;
      const members = membersByBoard.get(m.boardId) ?? [];
      return {
        id: m.board.id,
        title: m.board.title,
        description: m.board.description,
        color: m.board.color,
        role: isOwner ? "admin" : m.role,
        isOwner,
        owner: serializeUser(m.board.owner),
        members: members.map((member) => serializeUser(member.user)),
        memberCount: members.length,
        listCount: listCounts.get(m.boardId) ?? 0,
        cardCount: cardCounts.get(m.boardId) ?? 0,
        overdueCount: overdueCounts.get(m.boardId) ?? 0,
        createdAt: m.board.createdAt,
        updatedAt: m.board.updatedAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  return res.json({ boards });
}

export async function createBoard(req: Request, res: Response) {
  const data = parseBody(createBoardSchema, req.body);

  const board = await AppDataSource.transaction(async (manager) => {
    const created = await manager.save(
      manager.create(Board, {
        title: data.title,
        description: data.description ?? null,
        color: data.color ?? "#2563eb",
        ownerId: req.userId,
      }),
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
        DEFAULT_LISTS.map((title, position) =>
          manager.create(List, { title, position, boardId: created.id }),
        ),
      );
    }
    return created;
  });

  return res.status(201).json({ board });
}

export async function getBoard(req: Request, res: Response) {
  const { board, isOwner, isAdmin } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
  );

  const [members, labels, lists, cards, commentRows] = await Promise.all([
    memberRepo().find({
      where: { boardId: board.id },
      relations: { user: true },
      order: { createdAt: "ASC" },
    }),
    labelRepo().find({
      where: { boardId: board.id },
      order: { createdAt: "ASC" },
    }),
    listRepo().find({
      where: { boardId: board.id },
      order: { position: "ASC" },
    }),
    cardRepo().find({
      where: { boardId: board.id },
      relations: { labels: true, assignees: true, checklists: { items: true } },
      order: { position: "ASC" },
    }),
    commentRepo()
      .createQueryBuilder("comment")
      .innerJoin("comment.card", "card")
      .select('comment."cardId"', "cardId")
      .addSelect("COUNT(*)", "count")
      .where('card."boardId" = :boardId', { boardId: board.id })
      .groupBy('comment."cardId"')
      .getRawMany<{ cardId: string; count: string }>(),
  ]);

  const commentCounts = new Map(
    commentRows.map((r) => [r.cardId, Number(r.count)]),
  );

  return res.json({
    board: {
      id: board.id,
      title: board.title,
      description: board.description,
      color: board.color,
      blockNonEmptyListDeletion: board.blockNonEmptyListDeletion,
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      role: isAdmin ? "admin" : "member",
      isOwner,
      members: members.map((m) => ({
        ...serializeUser(m.user),
        role: m.user.id === board.ownerId ? "admin" : m.role,
        isOwner: m.user.id === board.ownerId,
        joinedAt: m.createdAt,
      })),
      labels: labels.map((label) => ({
        ...serializeLabel(label),
        cardCount: cards.filter((card) =>
          card.labels.some((l) => l.id === label.id),
        ).length,
      })),
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
    },
  });
}

export async function updateBoard(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const data = parseBody(updateBoardSchema, req.body);

  if (data.title !== undefined) board.title = data.title;
  if (data.description !== undefined) board.description = data.description;
  if (data.color !== undefined) board.color = data.color;
  if (data.blockNonEmptyListDeletion !== undefined) {
    board.blockNonEmptyListDeletion = data.blockNonEmptyListDeletion;
  }

  const saved = await AppDataSource.getRepository(Board).save(board);
  return res.json({ board: saved });
}

export async function deleteBoard(req: Request, res: Response) {
  const { board, isOwner } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
  );
  if (!isOwner) {
    throw new AppError(
      403,
      "Apenas o criador do quadro pode excluí-lo",
      "FORBIDDEN",
    );
  }

  await AppDataSource.getRepository(Board).delete({ id: board.id });
  return res.status(204).send();
}
