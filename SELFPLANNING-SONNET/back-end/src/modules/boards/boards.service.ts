import { AppDataSource } from "../../database";
import { Board } from "../../entities/Board";
import { BoardMember, BoardRole } from "../../entities/BoardMember";
import { Card } from "../../entities/Card";
import { Label } from "../../entities/Label";
import { List } from "../../entities/List";
import { User } from "../../entities/User";
import { AppError } from "../../utils/AppError";
import { serializeCard } from "../cards/card.serializer";

const boards = () => AppDataSource.getRepository(Board);
const members = () => AppDataSource.getRepository(BoardMember);

export async function listBoards(userId: string) {
  const rows: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    role: BoardRole;
    listCount: string;
    cardCount: string;
    overdueCount: string;
  }[] = await AppDataSource.query(
    `SELECT b.id, b.name, b.description, b.color, m.role,
       (SELECT COUNT(*) FROM lists l WHERE l."boardId" = b.id) AS "listCount",
       (SELECT COUNT(*) FROM cards c JOIN lists l ON l.id = c."listId" WHERE l."boardId" = b.id) AS "cardCount",
       (SELECT COUNT(*) FROM cards c JOIN lists l ON l.id = c."listId"
         WHERE l."boardId" = b.id AND c."dueDate" IS NOT NULL AND c."dueDate"::date < CURRENT_DATE) AS "overdueCount"
     FROM boards b
     JOIN board_members m ON m."boardId" = b.id AND m."userId" = $1
     ORDER BY b."createdAt" DESC`,
    [userId],
  );
  const memberRows: { boardId: string; userId: string; name: string }[] =
    rows.length === 0
      ? []
      : await AppDataSource.query(
          `SELECT m."boardId", u.id AS "userId", u.name
           FROM board_members m JOIN users u ON u.id = m."userId"
           WHERE m."boardId" = ANY($1::uuid[])
           ORDER BY (m.role = 'ADMIN') DESC, u.name ASC`,
          [rows.map((r) => r.id)],
        );
  return rows.map((r) => ({
    ...r,
    listCount: Number(r.listCount),
    cardCount: Number(r.cardCount),
    overdueCount: Number(r.overdueCount),
    members: memberRows
      .filter((m) => m.boardId === r.id)
      .map((m) => ({ userId: m.userId, name: m.name })),
  }));
}

const DEFAULT_LISTS = ["A fazer", "Em progresso", "Concluído"];

export async function createBoard(
  userId: string,
  data: {
    name: string;
    description?: string | null;
    color?: string;
    defaultLists?: boolean;
  },
) {
  return AppDataSource.transaction(async (manager) => {
    const board = await manager.save(
      manager.create(Board, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        ...(data.color ? { color: data.color.toUpperCase() } : {}),
      }),
    );
    if (data.defaultLists) {
      for (let i = 0; i < DEFAULT_LISTS.length; i++) {
        await manager.save(
          manager.create(List, { boardId: board.id, name: DEFAULT_LISTS[i], position: i }),
        );
      }
    }
    await manager.save(
      manager.create(BoardMember, {
        boardId: board.id,
        userId,
        role: "ADMIN",
      }),
    );
    return { ...board, role: "ADMIN" as BoardRole };
  });
}

export async function getBoard(
  boardId: string,
  role: BoardRole,
  opts: { labelIds: string[]; sortByDueDate: boolean },
) {
  const board = await boards().findOneByOrFail({ id: boardId });

  const lists = await AppDataSource.getRepository(List).find({
    where: { boardId },
    order: { position: "ASC" },
  });

  const cards = await AppDataSource.getRepository(Card)
    .createQueryBuilder("card")
    .innerJoin("card.list", "list")
    .leftJoinAndSelect("card.labels", "label")
    .leftJoinAndSelect("card.assignees", "assignee")
    .leftJoinAndSelect("card.checklists", "checklist")
    .leftJoinAndSelect("checklist.items", "item")
    .where("list.boardId = :boardId", { boardId })
    .orderBy("card.position", "ASC")
    .getMany();

  const countRows: { cardId: string; count: string }[] =
    await AppDataSource.query(
      `SELECT m."cardId", COUNT(*) AS count FROM comments m
       JOIN cards c ON c.id = m."cardId" JOIN lists l ON l.id = c."listId"
       WHERE l."boardId" = $1 GROUP BY m."cardId"`,
      [boardId],
    );
  const commentCounts = new Map(countRows.map((r) => [r.cardId, Number(r.count)]));

  let serialized = cards.map((c) => serializeCard(c, commentCounts.get(c.id) ?? 0));
  if (opts.labelIds.length > 0) {
    serialized = serialized.filter((c) =>
      c.labels.some((l) => opts.labelIds.includes(l.id)),
    );
  }
  if (opts.sortByDueDate) {
    serialized.sort((a, b) => {
      if (a.dueDate === b.dueDate) return a.position - b.position;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });
  }

  const labels = await AppDataSource.getRepository(Label).find({
    where: { boardId },
    order: { name: "ASC" },
  });

  return {
    id: board.id,
    name: board.name,
    description: board.description,
    color: board.color,
    role,
    lists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      position: l.position,
      cards: serialized.filter((c) => c.listId === l.id),
    })),
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    members: await listMembers(boardId),
  };
}

export async function updateBoard(
  boardId: string,
  data: { name?: string; description?: string | null; color?: string },
) {
  const board = await boards().findOneByOrFail({ id: boardId });
  if (data.name !== undefined) board.name = data.name.trim();
  if (data.description !== undefined) {
    board.description = data.description?.trim() || null;
  }
  if (data.color !== undefined) board.color = data.color.toUpperCase();
  await boards().save(board);
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    color: board.color,
  };
}

export async function deleteBoard(boardId: string) {
  await boards().delete({ id: boardId });
}

export async function listMembers(boardId: string) {
  const rows = await members().find({
    where: { boardId },
    relations: { user: true },
  });
  return rows
    .map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }))
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "ADMIN" ? -1 : 1));
}

async function adminCount(boardId: string) {
  return members().count({ where: { boardId, role: "ADMIN" } });
}

export async function addMember(boardId: string, email: string, role: BoardRole) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    throw new AppError(
      404,
      "Nenhum usuário com este e-mail. A pessoa precisa se cadastrar primeiro.",
    );
  }
  if (await members().findOne({ where: { boardId, userId: user.id } })) {
    throw new AppError(409, "Este usuário já é membro do quadro");
  }
  await members().save(members().create({ boardId, userId: user.id, role }));
  return { userId: user.id, name: user.name, email: user.email, role };
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole,
) {
  const member = await members().findOne({ where: { boardId, userId } });
  if (!member) throw new AppError(404, "Membro não encontrado");
  if (member.role === "ADMIN" && role !== "ADMIN" && (await adminCount(boardId)) <= 1) {
    throw new AppError(400, "O quadro precisa de ao menos um administrador");
  }
  member.role = role;
  await members().save(member);
}

export async function removeMember(boardId: string, userId: string) {
  const member = await members().findOne({ where: { boardId, userId } });
  if (!member) throw new AppError(404, "Membro não encontrado");
  if (member.role === "ADMIN" && (await adminCount(boardId)) <= 1) {
    throw new AppError(400, "O quadro precisa de ao menos um administrador");
  }
  await AppDataSource.transaction(async (manager) => {
    await manager.query(
      `DELETE FROM card_assignees WHERE "userId" = $2 AND "cardId" IN (
         SELECT c.id FROM cards c JOIN lists l ON l.id = c."listId" WHERE l."boardId" = $1)`,
      [boardId, userId],
    );
    await manager.delete(BoardMember, { boardId, userId });
  });
}
