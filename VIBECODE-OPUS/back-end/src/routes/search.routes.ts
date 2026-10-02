import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { Card } from "../entities/Card";
import { getUserId } from "../utils/auth";

const router = Router();

const RESULT_LIMIT = 10;

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
});

/** Searches boards and cards (by title) among the boards the user belongs to. */
router.get("/search", async (req, res) => {
  const userId = getUserId(res);
  const { q } = searchSchema.parse(req.query);
  if (q.length < 2) {
    return res.json({ boards: [], cards: [] });
  }

  const term = `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const memberBoards = `SELECT bm."boardId" FROM "board_members" bm WHERE bm."userId" = :userId`;

  const [boards, cards] = await Promise.all([
    AppDataSource.getRepository(Board)
      .createQueryBuilder("board")
      .where(`board.id IN (${memberBoards})`, { userId })
      .andWhere("board.title ILIKE :term", { term })
      .orderBy("board.updatedAt", "DESC")
      .limit(RESULT_LIMIT)
      .getMany(),
    AppDataSource.getRepository(Card)
      .createQueryBuilder("card")
      .innerJoinAndSelect("card.board", "board")
      .innerJoinAndSelect("card.list", "list")
      .where(`card.boardId IN (${memberBoards})`, { userId })
      .andWhere("card.title ILIKE :term", { term })
      .orderBy("card.updatedAt", "DESC")
      .limit(RESULT_LIMIT)
      .getMany(),
  ]);

  res.json({
    boards: boards.map((board) => ({
      id: board.id,
      title: board.title,
      color: board.color,
    })),
    cards: cards.map((card) => ({
      id: card.id,
      title: card.title,
      boardId: card.boardId,
      boardTitle: card.board.title,
      listTitle: card.list.title,
    })),
  });
});

export default router;
