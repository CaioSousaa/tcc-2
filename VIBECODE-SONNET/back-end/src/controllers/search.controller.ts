import type { Request, Response } from "express";
import { z } from "zod";
import { boardRepo, cardRepo } from "../services/repositories";

const querySchema = z.object({
  q: z.string().trim().max(100).default(""),
});

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Busca quadros e cards (por título) nos quadros dos quais o usuário participa. */
export async function search(req: Request, res: Response) {
  const { q } = querySchema.parse(req.query);
  if (q.length < 2) {
    return res.json({ boards: [], cards: [] });
  }

  const term = `%${escapeLike(q)}%`;
  const memberSubQuery =
    'SELECT bm."boardId" FROM "board_members" bm WHERE bm."userId" = :userId';

  const [boards, cards] = await Promise.all([
    boardRepo()
      .createQueryBuilder("b")
      .where(`b.id IN (${memberSubQuery})`, { userId: req.userId })
      .andWhere("b.title ILIKE :term", { term })
      .orderBy("b.title", "ASC")
      .take(8)
      .getMany(),
    cardRepo()
      .createQueryBuilder("c")
      .innerJoinAndSelect("c.board", "board")
      .innerJoinAndSelect("c.list", "list")
      .where(`c."boardId" IN (${memberSubQuery})`, { userId: req.userId })
      .andWhere("c.title ILIKE :term", { term })
      .orderBy("c.updatedAt", "DESC")
      .take(12)
      .getMany(),
  ]);

  return res.json({
    boards: boards.map((b) => ({ id: b.id, title: b.title, color: b.color })),
    cards: cards.map((c) => ({
      id: c.id,
      title: c.title,
      boardId: c.boardId,
      boardTitle: c.board.title,
      boardColor: c.board.color,
      listTitle: c.list.title,
    })),
  });
}
