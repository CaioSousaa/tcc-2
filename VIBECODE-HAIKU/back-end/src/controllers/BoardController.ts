import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { BoardMember, BoardRole } from "../entities/BoardMember";

export class BoardController {
  static async create(req: Request, res: Response) {
    const { name } = req.body;
    const boardRepo = AppDataSource.getRepository(Board);
    const memberRepo = AppDataSource.getRepository(BoardMember);

    const board = boardRepo.create({ name, ownerId: req.userId });
    await boardRepo.save(board);

    const member = memberRepo.create({
      boardId: board.id,
      userId: req.userId,
      role: BoardRole.ADMIN,
    });
    await memberRepo.save(member);

    res.json(board);
  }

  static async list(req: Request, res: Response) {
    const boardRepo = AppDataSource.getRepository(Board);
    const memberRepo = AppDataSource.getRepository(BoardMember);

    const memberships = await memberRepo.find({
      where: { userId: req.userId },
      relations: ["board"] as any,
    });

    const boards = memberships.map((m) => m.board);
    res.json(boards);
  }

  static async get(req: Request, res: Response) {
    const id = req.params.id as string;
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({
      where: { id },
      relations: ["lists", "labels", "members", "members.user"] as any,
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json(board);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const { name } = req.body;
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({ where: { id } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    board.name = name;
    await boardRepo.save(board);

    res.json(board);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({ where: { id } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await boardRepo.remove(board);

    res.json({ success: true });
  }
}
